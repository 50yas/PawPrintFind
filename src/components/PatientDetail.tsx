
import React, { useState } from 'react';
import { PetProfile, AIInsight } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { aiBridgeService } from '../services/aiBridgeService';
import { analyticsService } from '../services/analyticsService';
import { LoadingSpinner } from './LoadingSpinner';
import { CinematicImage } from './ui/CinematicImage';
import { AIInsightCard } from './AIInsightCard';

interface PatientDetailProps {
  patient: PetProfile;
  goBack: () => void;
}

const TimelineItem: React.FC<{ date: string; title: string; description?: string; icon: React.ReactNode }> = ({ date, title, description, icon }) => (
    <div className="relative pl-8 pb-8 last:pb-0 border-l-2 border-white/10">
        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-primary neon-glow-teal"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
             <h4 className="font-bold text-white text-lg">{title}</h4>
             <span className="text-xs font-mono font-bold text-primary/60 bg-primary/10 px-2 py-1 rounded-full border border-primary/20">{date}</span>
        </div>
        {description && <p className="text-sm text-slate-400">{description}</p>}
    </div>
);

export const PatientDetail: React.FC<PatientDetailProps> = ({ patient, goBack }) => {
  const { t } = useTranslations();
  const { addSnackbar } = useSnackbar();
  const [showContactModal, setShowContactModal] = useState(false);
  const [messageTopic, setMessageTopic] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'medical' | 'media'>('overview');
  const [currentInsights, setCurrentInsights] = useState<AIInsight[]>(patient.aiInsights || []);

  const handlePrint = () => window.print();

  const handleCheckHealth = async () => {
    setIsAnalyzing(true);
    try {
      analyticsService.trackHealthCheck(patient.id, patient.breed);
      const insights = await aiBridgeService.generateHealthInsights(patient);
      setCurrentInsights(insights);
      addSnackbar(t('aiInsightsGenerated'), 'success');
    } catch (err) {
      console.error(err);
      addSnackbar(t('genericError'), 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };
  const handleDraftMessage = async () => {
    if (!messageTopic) return;
    setIsDrafting(true);
    try {
      const draft = await aiBridgeService.draftVetMessageToOwner(patient, messageTopic);
      setGeneratedMessage(draft);
    } catch (err) {
      console.error(err);
      addSnackbar(t('genericError'), 'error');
    }
    setIsDrafting(false);
  };
  const sendMessage = () => {
    addSnackbar(t('messageSentToOwnerAlert', { ownerEmail: patient.ownerEmail || '' }), 'success');
    setShowContactModal(false);
    setGeneratedMessage('');
    setMessageTopic('');
  };
  
  const labelStyles = "block text-sm font-medium text-slate-400";

  return (
    <>
      <div className="max-w-5xl mx-auto pb-12">
        <div className="flex items-center justify-between mb-6">
             <button onClick={goBack} className="flex items-center text-slate-400 hover:text-primary transition-colors font-bold">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                 {t('backButton')}
             </button>
             <div className="flex space-x-3 no-print">
                <button onClick={handlePrint} className="glass-btn !py-2 !px-4 text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                    {t('printSummaryButton')}
                </button>
                <button onClick={() => setShowContactModal(true)} className="btn btn-primary rounded-xl flex items-center neon-glow-teal">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                    {t('contactOwnerButton')}
                </button>
            </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                 <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-primary/50 shadow-lg flex-shrink-0 neon-glow-teal">
                    <CinematicImage priority src={patient.photos[0]?.url} alt={patient.name} />
                 </div>
                 <div>
                     <h1 className="text-4xl font-bold text-white mb-2">{patient.name}</h1>
                     <div className="flex flex-wrap gap-3 items-center">
                         <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-bold text-white border border-white/10">{patient.breed}</span>
                         <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-bold text-white border border-white/10">{patient.age}</span>
                         <span className={`px-3 py-1 rounded-full text-sm font-bold ${patient.isLost ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>{patient.isLost ? t('statusLost') : t('statusSafe')}</span>
                     </div>
                 </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 px-8">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    {t('tabOverview')}
                </button>
                <button
                    onClick={() => setActiveTab('medical')}
                    className={`py-4 px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${activeTab === 'medical' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    {t('tabMedical')}
                </button>
                 <button
                    onClick={() => setActiveTab('media')}
                    className={`py-4 px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${activeTab === 'media' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    {t('tabMedia')}
                </button>
            </div>

            {/* Content */}
            <div className="p-8 printable-area">
                {activeTab === 'overview' && (
                    <div className="grid md:grid-cols-2 gap-12">
                         <div>
                            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">{t('keyInfoTitle')}</h3>
                            <dl className="space-y-4">
                                <div className="flex justify-between">
                                    <dt className="text-slate-400 font-medium">{t('ownerEmailLabel')}</dt>
                                    <dd className="text-white font-bold font-mono text-sm">{patient.ownerEmail}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-slate-400 font-medium">{t('weightLabel')}</dt>
                                    <dd className="text-white font-bold">{patient.weight}</dd>
                                </div>
                                 <div>
                                    <dt className="text-slate-400 font-medium mb-1">{t('behaviorLabel')}</dt>
                                    <dd className="text-slate-300 bg-white/5 p-3 rounded-xl text-sm border border-white/5">{patient.behavior || 'N/A'}</dd>
                                </div>
                            </dl>
                        </div>
                         <div>
                            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">{t('quickMedicalView')}</h3>
                             <div className="space-y-3">
                                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider block mb-1">{t('allergiesLabel')}</span>
                                    <p className="text-white font-medium">{patient.medicalRecord?.allergies || t('noneReported')}</p>
                                </div>
                                 <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">{t('chronicConditionsLabel')}</span>
                                    <p className="text-white font-medium">{patient.medicalRecord?.chronicConditions || t('noneReported')}</p>
                                </div>
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'overview' && (
                    <div className="mt-12 border-t border-white/10 pt-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <span className="status-pulse-green" />
                                {t('aiProactiveInsights')}
                                <span className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent"></span>
                            </h3>
                            <button
                                onClick={handleCheckHealth}
                                disabled={isAnalyzing}
                                className="glass-btn !py-1.5 !px-4 text-xs font-bold flex items-center gap-2"
                            >
                                {isAnalyzing ? <LoadingSpinner size="sm" /> : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {t('checkHealthButton') || "Check Health"}
                                    </>
                                )}
                            </button>
                        </div>
                        
                        {currentInsights.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {currentInsights.map(insight => (
                                    <AIInsightCard key={insight.id} insight={insight} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white/5 rounded-2xl p-8 text-center border border-dashed border-white/10 hud-grid-bg">
                                <p className="text-sm text-slate-400">{t('noInsightsYet') || "No AI insights generated yet. Click the button above to analyze patient data."}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'medical' && (
                    <div className="max-w-3xl">
                         <h3 className="text-lg font-bold text-white mb-6">{t('medicalRecordTitle')} & Timeline</h3>
                         <div className="mt-4">
                            {/* Mock initial registration */}
                            <TimelineItem 
                                date="Registration" 
                                title={t('patientRegisteredEvent')}
                                description={t('patientRegisteredDesc')}
                                icon={null}
                            />
                            {patient.medicalRecord?.vaccinations?.map((vac, i) => (
                                <TimelineItem 
                                    key={i}
                                    date={vac.date}
                                    title={t('vaccinationEvent', {name: vac.name})}
                                    icon={null}
                                />
                            ))}
                             {patient.healthChecks?.map((check, i) => (
                                <TimelineItem 
                                    key={`check-${i}`}
                                    date={new Date(check.timestamp).toLocaleDateString()}
                                    title={t('aiHealthCheckEvent')}
                                    description={check.symptoms}
                                    icon={null}
                                />
                            ))}
                             <div className="relative pl-8 pt-2">
                                <div className="absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-white/20"></div>
                                <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">{t('startOfRecords')}</p>
                            </div>
                         </div>
                    </div>
                )}

                {activeTab === 'media' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {patient.photos.map(photo => (
                            <div key={photo.id} className="relative group rounded-xl overflow-hidden shadow-md">
                                <div className="w-full h-full aspect-square">
                                    <CinematicImage src={photo.url} alt={photo.description} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                </div>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                                    <p className="text-white font-bold">{photo.description}</p>
                                    <p className="text-white/80 text-xs mt-1">{t('marksIdentified', {count: photo.marks.length})}</p>
                                </div>
                                {photo.marks.map((mark, index) => (<div key={index} className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-yellow-400 border border-white shadow-sm pointer-events-none" style={{ left: `${mark.x}%`, top: `${mark.y}%` }}></div>))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
      
      {showContactModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 no-print">
            <div className="bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl p-6 w-full max-w-lg neon-border">
                <h3 className="text-xl font-bold text-white">{t('contactOwnerButton')}</h3>
                <div className="mt-4 space-y-4">
                    <div><label htmlFor="topic" className={labelStyles}>{t('messageTopicLabel')}</label><input type="text" id="topic" value={messageTopic} onChange={e => setMessageTopic(e.target.value)} className="input-base mt-1" placeholder={t('aiAssistantPlaceholder')} /></div>
                    <button onClick={handleDraftMessage} disabled={isDrafting || !messageTopic} className="btn btn-primary w-full flex justify-center items-center rounded-xl">{isDrafting ? <LoadingSpinner/> : t('draftMessageButton')}</button>
                    {generatedMessage && (<div><label className={labelStyles}>{t('generatedMessageLabel')}</label><textarea value={generatedMessage} onChange={e => setGeneratedMessage(e.target.value)} rows={6} className="input-base mt-1 text-sm p-3"></textarea></div>)}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={() => setShowContactModal(false)} className="glass-btn !py-2 !px-4 text-sm">{t('cancelButton')}</button>
                    <button onClick={sendMessage} disabled={!generatedMessage} className="btn btn-primary !bg-green-600 hover:!bg-green-500 rounded-xl neon-glow-green">{t('sendMessageToOwner')}</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};
