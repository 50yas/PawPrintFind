
import React, { useState, useEffect, useRef } from 'react';
import { PetProfile, PhotoWithMarks, UniqueMark, Geolocation, MedicalRecord, Vaccination, User } from '../types';
import { analyzeVideo, transcribeAudio, identifyBreedFromImage, generatePetIdentikit } from '../services/geminiService';
import { dbService } from '../services/firebase';
import { ImageTagger } from './ImageTagger';
import { LoadingSpinner } from './LoadingSpinner';
import { ProgressBar } from './ProgressBar';
import { Stepper } from './Stepper';
import { useTranslations } from '../hooks/useTranslations';

declare var L: any;

interface RegisterPetProps {
  onRegister: (pet: PetProfile) => void;
  goToDashboard: () => void;
  currentUser: User;
  existingPet: PetProfile | null;
  initialLocation?: Geolocation | null;
  mode: 'owned' | 'stray' | 'forAdoption';
}

// Custom Funny Toast for Pet-Themed Warnings
const PetLogicToast = ({ message, type = 'warning' }: { message: string, type?: 'warning' | 'error' }) => (
    <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-bounce-subtle`}>
        <div className={`px-6 py-4 rounded-2xl shadow-2xl border-2 flex items-center gap-4 backdrop-blur-xl ${type === 'warning' ? 'bg-amber-500/90 border-white text-white' : 'bg-red-600/90 border-white text-white'}`}>
            <span className="text-2xl">{type === 'warning' ? '🐾' : '🛑'}</span>
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{type === 'warning' ? 'Pet Logic Warning' : 'System Error'}</span>
                <span className="font-bold text-sm leading-tight">{message}</span>
            </div>
        </div>
    </div>
);

const FloatingLabelInput = ({ label, id, value, onChange, required = false, type = "text", placeholder = " ", shake = false }: any) => (
    <div className={`relative pt-2 transition-transform ${shake ? 'animate-shake' : ''}`}>
        <input 
            type={type} 
            id={id} 
            value={value} 
            onChange={onChange} 
            required={required}
            className={`block w-full px-4 py-3 text-foreground bg-background border rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm ${shake ? 'border-red-500 ring-4 ring-red-500/10' : 'border-input focus:border-primary'}`}
            placeholder={placeholder}
        />
        <label 
            htmlFor={id} 
            className={`absolute text-sm duration-200 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-background px-2 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-[55%] peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 pointer-events-none ${shake ? 'text-red-500 font-bold' : 'text-muted-foreground peer-focus:text-primary'}`}
        >
            {label} {required && <span className="text-red-500">*</span>}
        </label>
    </div>
);

const PHOTO_STAGE_KEYS = ['photoStageFace', 'photoStageRightSide', 'photoStageLeftSide', 'photoStageTopView', 'photoStageTail'];

const HomeAreaMap: React.FC<{ locations: Geolocation[], onAdd: (loc: Geolocation) => void }> = ({ locations, onAdd }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any | null>(null);
    const markersRef = useRef<any[]>([]);

    useEffect(() => {
        if (mapRef.current && !mapInstance.current && typeof L !== 'undefined') {
            mapInstance.current = L.map(mapRef.current, { attributionControl: false }).setView([41.90, 12.49], 5);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(mapInstance.current);
            mapInstance.current.on('click', (e: any) => {
                onAdd({ latitude: e.latlng.lat, longitude: e.latlng.lng });
            });
        }
        return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
    }, []); 

    useEffect(() => {
        if (mapInstance.current) {
            markersRef.current.forEach(layer => mapInstance.current.removeLayer(layer));
            markersRef.current = [];
            locations.forEach(loc => {
                const circle = L.circle([loc.latitude, loc.longitude], { 
                    radius: 2500, color: '#0d9488', fillColor: '#2dd4bf', fillOpacity: 0.3, weight: 2
                }).addTo(mapInstance.current);
                markersRef.current.push(circle);
                const marker = L.marker([loc.latitude, loc.longitude]).addTo(mapInstance.current);
                markersRef.current.push(marker);
            });
            if (locations.length > 0) {
                const group = new L.FeatureGroup(markersRef.current);
                mapInstance.current.fitBounds(group.getBounds().pad(0.2));
            }
        }
    }, [locations]);

    return <div ref={mapRef} className="h-72 w-full rounded-2xl border-2 border-border z-0 cursor-crosshair shadow-inner bg-muted/20" />;
};

export const RegisterPet: React.FC<RegisterPetProps> = ({ onRegister, goToDashboard, currentUser, existingPet, mode }) => {
  const { t } = useTranslations();
  
  const getSteps = () => {
    switch (mode) {
        case 'owned': return [t('step1'), t('step2'), t('step3'), t('stepMedical'), t('step4')];
        case 'stray': return [t('step1'), t('step2'), t('stepMedical'), t('step4')];
        case 'forAdoption': return [t('step1'), t('step2'), t('stepMedical'), t('step4')];
    }
  }

  const steps = getSteps();
  const totalSteps = steps.length;
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [funnyError, setFunnyError] = useState<string | null>(null);
  const [shakingFields, setShakingFields] = useState<string[]>([]);

  // Form State
  const [id] = useState(existingPet?.id || Date.now().toString());
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [behavior, setBehavior] = useState('');
  const [photos, setPhotos] = useState<(PhotoWithMarks | undefined)[]>(new Array(5).fill(undefined));
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoAnalysis, setVideoAnalysis] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioNotes, setAudioNotes] = useState('');
  const [homeLocations, setHomeLocations] = useState<Geolocation[]>([]);
  const [allergies, setAllergies] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');
  const [medications, setMedications] = useState('');
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [aiIdentityCode, setAiIdentityCode] = useState('');
  const [aiPhysicalDescription, setAiPhysicalDescription] = useState('');
  const [isGeneratingIdentity, setIsGeneratingIdentity] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [isIdentifyingBreed, setIsIdentifyingBreed] = useState(false);
  const [currentCompleteness, setCurrentCompleteness] = useState(0);

  useEffect(() => {
    if (existingPet) {
        setName(existingPet.name);
        setBreed(existingPet.breed);
        setAge(existingPet.age);
        setWeight(existingPet.weight);
        setBehavior(existingPet.behavior);
        const newPhotos = new Array(5).fill(undefined);
        existingPet.photos.forEach((p, i) => { if(i < 5) newPhotos[i] = p; });
        setPhotos(newPhotos);
        setVideoAnalysis(existingPet.videoAnalysis);
        setAudioNotes(existingPet.audioNotes);
        setHomeLocations(existingPet.homeLocations || []);
        setAllergies(existingPet.medicalRecord?.allergies || '');
        setChronicConditions(existingPet.medicalRecord?.chronicConditions || '');
        setMedications(existingPet.medicalRecord?.medications || '');
        setVaccinations(existingPet.medicalRecord?.vaccinations || []);
        setAiIdentityCode(existingPet.aiIdentityCode || '');
        setAiPhysicalDescription(existingPet.aiPhysicalDescription || '');
    }
  }, [existingPet]);

  useEffect(() => {
      let score = 0;
      if (name.length > 0 && breed.length > 0) score += 20;
      const validPhotoCount = photos.filter(p => p !== undefined).length;
      score += Math.min(5, validPhotoCount) * 10;
      if (homeLocations.length > 0) score += 10;
      if (vaccinations.length > 0 || allergies || chronicConditions) score += 10;
      if (aiIdentityCode || videoAnalysis) score += 10;
      setCurrentCompleteness(Math.min(100, score));
  }, [name, breed, photos, homeLocations, vaccinations, allergies, chronicConditions, aiIdentityCode, videoAnalysis]);

  const triggerFunnyWarning = (msg: string, fields: string[]) => {
      setFunnyError(msg);
      setShakingFields(fields);
      setTimeout(() => {
          setFunnyError(null);
          setShakingFields([]);
      }, 4000);
  };

  const handleNext = () => {
      if (currentStep === 1) {
          const missing = [];
          if (!name) missing.push('name');
          if (!breed) missing.push('breed');
          
          if (missing.length > 0) {
              triggerFunnyWarning("Halt! Even a goldfish needs a name. Please provide a Name and Breed! 🐾", missing);
              return;
          }
      }
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };
  
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newPhoto: PhotoWithMarks = {
        id: Date.now().toString(),
        url: URL.createObjectURL(file),
        file: file,
        marks: [],
        description: t(PHOTO_STAGE_KEYS[index]),
      };
      
      if (photos.filter(p => p).length === 0) {
        setIsIdentifyingBreed(true);
        identifyBreedFromImage(file).then(suggestedBreed => {
            if (suggestedBreed && !breed) {
                setBreed(suggestedBreed);
            }
            setIsIdentifyingBreed(false);
        });
      }

      const updatedPhotos = [...photos];
      updatedPhotos[index] = newPhoto;
      setPhotos(updatedPhotos);
    }
  };

  const handleGenerateIdentikit = async () => {
      const validPhotos = photos.filter((p): p is PhotoWithMarks => p !== undefined);
      if (validPhotos.length === 0) return;
      setIsGeneratingIdentity(true);
      const result = await generatePetIdentikit(validPhotos[0].file);
      setAiIdentityCode(result.code);
      setAiPhysicalDescription(result.description);
      setIsGeneratingIdentity(false);
  };

  const addMarkToPhoto = (photoId: string, mark: UniqueMark) => {
    setPhotos(prev => prev.map(p => p?.id === photoId ? { ...p, marks: [...p.marks, mark] } : p));
  };
  
  const handleAnalyzeVideo = async () => {
      if(!videoFile) return;
      setIsProcessing(true);
      setVideoUploadProgress(0);
      try {
          const analysis = await analyzeVideo(videoFile, setVideoUploadProgress);
          setVideoAnalysis(analysis);
      } catch(e) { console.error(e); triggerFunnyWarning(t('videoAnalysisFailed'), []); }
      setIsProcessing(false);
  }

  const handleTranscribeAudio = async () => {
      if(!audioFile) return;
      setIsProcessing(true);
      setAudioUploadProgress(0);
      try {
          const transcription = await transcribeAudio(audioFile, setAudioUploadProgress);
          setAudioNotes(transcription);
      } catch(e) { console.error(e); triggerFunnyWarning(t('audioTranscriptionFailed'), []); }
      setIsProcessing(false);
  }

  const handleVaccinationChange = (index: number, field: keyof Vaccination, value: string) => {
    const newVaccinations = [...vaccinations];
    newVaccinations[index] = { ...newVaccinations[index], [field]: value };
    setVaccinations(newVaccinations);
  };
  const addVaccination = () => setVaccinations([...vaccinations, { name: '', date: '' }]);
  const removeVaccination = (index: number) => setVaccinations(vaccinations.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const validPhotos = photos.filter((p): p is PhotoWithMarks => p !== undefined);
    if (validPhotos.length === 0) {
      triggerFunnyWarning(t('uploadOnePhotoWarning'), []);
      setIsSaving(false);
      return;
    }

    try {
        // PROD-LEVEL PATHING: Standard rules usually allow users to write to users/UID/pets
        const ownerUid = currentUser.uid;
        
        const processedPhotos = await Promise.all(validPhotos.map(async (p) => {
            let finalUrl = p.url;
            if (p.file) {
                // Role-based storage path
                const storagePath = currentUser.activeRole === 'shelter'
                    ? `shelters/${ownerUid}/pets/${id}`
                    : `users/${ownerUid}/pets/${id}`;
                finalUrl = await dbService.uploadImage(p.file, storagePath);
            }
            return {
                id: p.id || Date.now().toString(),
                url: finalUrl || '',
                marks: p.marks || [],
                description: p.description || 'Photo'
            };
        }));

        const medicalRecord: MedicalRecord = { 
            allergies: allergies || '', 
            chronicConditions: chronicConditions || '', 
            medications: medications || '', 
            vaccinations: vaccinations.map(v => ({name: v.name || '', date: v.date || ''})) 
        };
        
        const newPet: PetProfile = { 
            id, 
            ownerEmail: (mode === 'owned' || mode === 'forAdoption') ? currentUser.email : null,
            guardianEmails: mode === 'stray' ? [currentUser.email] : [],
            status: mode,
            isLost: existingPet?.isLost || false, 
            searchRadius: existingPet?.searchRadius || null,
            name: name || 'Unnamed', 
            breed: breed || 'Unknown', 
            age: age || '', 
            weight: weight || '', 
            behavior: behavior || '', 
            photos: processedPhotos as any,
            homeLocations: homeLocations.map(l => ({latitude: l.latitude, longitude: l.longitude})), 
            lastSeenLocation: existingPet?.lastSeenLocation || null,
            videoAnalysis: videoAnalysis || '', 
            audioNotes: audioNotes || '', 
            medicalRecord,
            vetLinkStatus: existingPet?.vetLinkStatus || 'unlinked',
            vetEmail: existingPet?.vetEmail || undefined,
            sightings: existingPet?.sightings || [],
            healthChecks: existingPet?.healthChecks || [],
            aiIdentityCode: aiIdentityCode || '', 
            aiPhysicalDescription: aiPhysicalDescription || ''
        };
        
        const cleanPet = JSON.parse(JSON.stringify(newPet));
        onRegister(cleanPet);
    } catch (error: any) {
        console.error("Error registering pet:", error);
        if (error.code === 'storage/unauthorized') {
            triggerFunnyWarning("Access Denied! Did your human forget to sign the papers? (Permission Error)", []);
        } else {
            triggerFunnyWarning("The system is being catty! Failed to save pet profile.", []);
        }
    } finally {
        setIsSaving(false);
    }
  };
  
  const getTitle = () => {
    switch (mode) {
        case 'owned': return t('createImprontaTitle');
        case 'stray': return t('registerStrayTitle');
        case 'forAdoption': return t('registerForAdoptionTitle');
    }
  }

  const showAI = currentStep === 3 && mode === 'owned';
  const showMedical = (currentStep === 4 && mode === 'owned') || (currentStep === 3 && mode !== 'owned');
  const showLocation = (currentStep === 5 && mode === 'owned') || (currentStep === 4 && mode !== 'owned');
  const validPhotosCount = photos.filter(p => p !== undefined).length;

  return (
    <div className="max-w-5xl mx-auto bg-card rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[80vh] border border-border relative">
      
      {funnyError && <PetLogicToast message={funnyError} />}

      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-background to-background p-8 border-b border-border relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <h2 className="text-3xl font-extrabold text-foreground tracking-tight">{getTitle()}</h2>
                  <p className="text-muted-foreground mt-2 font-medium">{t('createImprontaDescription')}</p>
              </div>
              
              <div className="flex flex-col items-end gap-1 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-border shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Profile Strength</span>
                  <div className="flex items-center gap-3">
                      <div className="w-32 h-2.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-700 ease-out rounded-full ${currentCompleteness < 50 ? 'bg-red-500' : currentCompleteness < 80 ? 'bg-amber-500' : 'bg-green-500'}`} 
                            style={{ width: `${currentCompleteness}%` }}
                          ></div>
                      </div>
                      <span className="text-sm font-bold text-foreground font-mono">{currentCompleteness}%</span>
                  </div>
              </div>
          </div>
      </div>
      
      <div className="px-8 pt-8">
        <Stepper steps={steps} currentStep={currentStep} onStepClick={(s) => { if(s < currentStep) setCurrentStep(s) }} />
      </div>
      
      <div className="p-8 flex-grow">
        <form className="space-y-8 animate-fade-in">
            
            {/* STEP 1: BASIC INFO */}
            {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <FloatingLabelInput 
                            id="name" 
                            label={t('petNameLabel')} 
                            value={name} 
                            onChange={(e: any) => setName(e.target.value)} 
                            required 
                            shake={shakingFields.includes('name')}
                        />
                        <div className="relative">
                            <FloatingLabelInput 
                                id="breed" 
                                label={t('breedLabel')} 
                                value={breed} 
                                onChange={(e: any) => setBreed(e.target.value)} 
                                required 
                                shake={shakingFields.includes('breed')}
                            />
                            {isIdentifyingBreed && <span className="absolute right-3 top-4 text-xs text-primary animate-pulse font-medium bg-primary/10 px-2 py-1 rounded">{t('identifyingBreed')}</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FloatingLabelInput id="age" label={t('ageLabel')} value={age} onChange={(e: any) => setAge(e.target.value)} />
                            <FloatingLabelInput id="weight" label={t('weightLabel')} value={weight} onChange={(e: any) => setWeight(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="behavior" className="block text-sm font-medium text-muted-foreground pl-1 uppercase tracking-wide">{t('behaviorLabel')}</label>
                        <textarea 
                            id="behavior" 
                            value={behavior} 
                            onChange={(e) => setBehavior(e.target.value)} 
                            rows={8} 
                            className="block w-full px-4 py-3 text-foreground bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-sm"
                            placeholder="e.g. Friendly with people but scared of thunder..."
                        ></textarea>
                    </div>
                </div>
            )}

            {/* STEP 2: PHOTOS & MARKS */}
            {currentStep === 2 && (
                <div className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {PHOTO_STAGE_KEYS.map((stageKey, index) => {
                            const hasPhoto = photos[index] !== undefined;
                            return (
                                <div key={stageKey} className={`relative group aspect-square rounded-2xl border-2 border-dashed ${hasPhoto ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'} hover:border-primary transition-all overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:shadow-md`}>
                                    <input id={`photo-upload-${index}`} type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, index)} className="hidden" />
                                    <label htmlFor={`photo-upload-${index}`} className="absolute inset-0 cursor-pointer z-10"></label>
                                    
                                    {hasPhoto ? (
                                        <>
                                            <img src={photos[index]?.url} alt={t(stageKey)} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                <span className="text-white text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm px-2 py-1 rounded">{t('changePhotoButton')}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-3 bg-background rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            </div>
                                            <span className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-wide">{t(stageKey)}</span>
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {validPhotosCount > 0 && (
                        <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-border">
                            <div className="bg-gradient-to-br from-card to-muted/30 border border-border p-6 rounded-2xl shadow-sm">
                                <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                                    <span className="p-1.5 bg-primary/10 rounded-lg text-primary"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg></span>
                                    AI Biometric Identity
                                </h4>
                                {!aiIdentityCode ? (
                                    <button type="button" onClick={handleGenerateIdentikit} disabled={isGeneratingIdentity} className="btn btn-secondary w-full py-4 text-sm font-bold border-2 hover:border-primary transition-all">
                                        {isGeneratingIdentity ? <LoadingSpinner /> : 'Generate Visual Hash'}
                                    </button>
                                ) : (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="p-4 bg-background rounded-xl border border-border shadow-inner">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Unique Visual Hash</p>
                                            <p className="font-mono text-primary font-bold text-lg tracking-widest">{aiIdentityCode}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground italic bg-muted/50 p-3 rounded-lg border-l-4 border-primary">"{aiPhysicalDescription}"</p>
                                        <button type="button" onClick={handleGenerateIdentikit} className="text-xs font-bold text-primary hover:underline uppercase tracking-wide">Regenerate Analysis</button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-bold text-foreground">{t('tagUniqueMarks')}</h4>
                                    <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 rounded-md font-bold uppercase tracking-wider">Recommended</span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{t('tagUniqueMarksDesc')}</p>
                                <div className="max-h-[350px] overflow-y-auto pr-2 grid grid-cols-2 gap-4 custom-scrollbar">
                                    {photos.map((photo) => photo ? <ImageTagger key={photo.id} photo={photo} onAddMark={addMarkToPhoto} /> : null)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* STEP 3: ADVANCED AI */}
            {showAI && (
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors bg-card shadow-sm">
                        <h4 className="font-bold text-lg mb-4 text-foreground">{t('videoUploadLabel')}</h4>
                        <div className="flex items-center gap-4">
                            <label className="btn btn-secondary cursor-pointer hover:bg-muted transition-colors">
                                {videoFile ? t('changePhotoButton') : 'Select Video'}
                                <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)} className="hidden" />
                            </label>
                            {videoFile && (
                                <button type="button" onClick={handleAnalyzeVideo} disabled={isProcessing} className="btn btn-primary shadow-lg">
                                    {isProcessing ? t('analyzingStatus') : t('analyzeVideoButton')}
                                </button>
                            )}
                        </div>
                        {isProcessing && <div className="mt-4"><ProgressBar progress={videoUploadProgress} /></div>}
                        {videoAnalysis && <div className="mt-4 p-4 bg-muted/50 rounded-xl text-sm border-l-4 border-primary shadow-inner">{videoAnalysis}</div>}
                    </div>

                    <div className="border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors bg-card shadow-sm">
                        <h4 className="font-bold text-lg mb-4 text-foreground">{t('audioUploadLabel')}</h4>
                        <div className="flex items-center gap-4">
                            <label className="btn btn-secondary cursor-pointer hover:bg-muted transition-colors">
                                {audioFile ? t('changePhotoButton') : 'Select Audio'}
                                <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files ? e.target.files[0] : null)} className="hidden" />
                            </label>
                            {audioFile && (
                                <button type="button" onClick={handleTranscribeAudio} disabled={isProcessing} className="btn btn-primary shadow-lg">
                                    {isProcessing ? t('transcribingStatus') : t('transcribeAudioButton')}
                                </button>
                            )}
                        </div>
                        {isProcessing && <div className="mt-4"><ProgressBar progress={audioUploadProgress} /></div>}
                        {audioNotes && <div className="mt-4 p-4 bg-muted/50 rounded-xl text-sm border-l-4 border-primary shadow-inner">{audioNotes}</div>}
                    </div>
                </div>
            )}

            {/* STEP 4: MEDICAL */}
            {showMedical && (
                <div className="space-y-8">
                    <div className="grid md:grid-cols-3 gap-6">
                        <FloatingLabelInput id="allergies" label={t('allergiesLabel')} value={allergies} onChange={(e: any) => setAllergies(e.target.value)} />
                        <FloatingLabelInput id="chronic" label={t('chronicConditionsLabel')} value={chronicConditions} onChange={(e: any) => setChronicConditions(e.target.value)} />
                        <FloatingLabelInput id="meds" label={t('medicationsLabel')} value={medications} onChange={(e: any) => setMedications(e.target.value)} />
                    </div>
                    
                    <div className="bg-muted/20 p-6 rounded-2xl border border-border">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-lg text-foreground">{t('vaccinationsTitle')}</h4>
                            <button type="button" onClick={addVaccination} className="text-sm font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-primary/20">+ Add Record</button>
                        </div>
                        {vaccinations.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic text-center py-4 bg-background rounded-xl border border-dashed border-border">No vaccination records added yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {vaccinations.map((vac, index) => (
                                    <div key={index} className="flex gap-4 items-center animate-fade-in">
                                        <input type="text" value={vac.name} onChange={e => handleVaccinationChange(index, 'name', e.target.value)} placeholder={t('vaccinationNamePlaceholder')} className="flex-grow p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                                        <input type="date" value={vac.date} onChange={e => handleVaccinationChange(index, 'date', e.target.value)} className="w-40 p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                                        <button type="button" onClick={() => removeVaccination(index)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-3 rounded-xl transition-colors border border-transparent hover:border-red-200">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* STEP 5: LOCATION */}
            {showLocation && (
                <div className="space-y-6">
                    <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground text-lg">{mode === 'stray' ? t('step4DescStray') : mode === 'forAdoption' ? t('foundLocationTitle') : t('homeAreasTitle')}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{mode === 'stray' ? t('step4DescStray') : mode === 'forAdoption' ? t('finalStepForAdoption') : t('step4DescOwner')}</p>
                        </div>
                    </div>

                    <HomeAreaMap locations={homeLocations} onAdd={(loc) => setHomeLocations([...homeLocations, loc])} />
                    
                    <button type="button" onClick={() => {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(pos => {
                                const newLoc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                                setHomeLocations([...homeLocations, newLoc]);
                            });
                        }
                    }} className="btn btn-secondary w-full py-4 flex items-center justify-center gap-2 font-bold text-sm hover:border-primary/50 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                        {t('addHomeAreaButton')}
                    </button>

                    {homeLocations.length > 0 && (
                        <div className="bg-muted/30 p-4 rounded-xl border border-border">
                            <h5 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wide">Saved Locations</h5>
                            <div className="space-y-2">
                                {homeLocations.map((loc, i) => (
                                    <div key={i} className="flex justify-between items-center bg-background p-3 rounded-lg border border-border shadow-sm">
                                        <span className="font-mono text-sm font-medium">{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</span>
                                        <button type="button" onClick={() => setHomeLocations(homeLocations.filter((_, idx) => idx !== i))} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

        </form>
      </div>

      {/* Footer Navigation */}
      <div className="p-6 md:p-8 border-t border-border flex justify-between items-center bg-muted/20 backdrop-blur-sm sticky bottom-0 z-10">
          {currentStep > 1 ? (
              <button type="button" onClick={handleBack} className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                  {t('backButton')}
              </button>
          ) : (
              <button type="button" onClick={goToDashboard} className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                  {t('cancelButton')}
              </button>
          )}

          {currentStep < totalSteps ? (
              <button type="button" onClick={handleNext} className="btn btn-primary px-10 py-3.5 shadow-xl shadow-primary/25 hover:shadow-primary/40 transform hover:-translate-y-0.5 transition-all font-bold text-sm tracking-wide">
                  {t('nextButton')}
              </button>
          ) : (
              <button type="button" onClick={handleSubmit} disabled={isSaving} className="btn btn-primary px-10 py-3.5 shadow-xl shadow-primary/25 hover:shadow-primary/40 transform hover:-translate-y-0.5 transition-all !bg-green-600 hover:!bg-green-700 border-green-500 font-bold text-sm tracking-wide">
                  {isSaving ? <LoadingSpinner /> : t('submitButton')}
              </button>
          )}
      </div>

      <style>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes bounce-subtle {
            0%, 100% { transform: translate(-50%, 0); }
            50% { transform: translate(-50%, -10px); }
        }
        .animate-bounce-subtle {
            animation: bounce-subtle 2s infinite;
        }
      `}</style>
    </div>
  );
};
