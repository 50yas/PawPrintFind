import React from 'react';
import { PetProfile } from '../types';

interface AIIdentikitCardProps {
  pet: PetProfile;
  id?: string; // Allow passing an ID for the container (useful for capture)
}

export const AIIdentikitCard: React.FC<AIIdentikitCardProps> = ({ pet, id }) => {
  const photoUrl = pet.photos.length > 0 ? pet.photos[0].url : '/default-pet.png';

  return (
    <div id={id} className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-black border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* Header */}
      <div className="relative z-10 p-4 border-b border-cyan-500/30 bg-black/50 backdrop-blur-sm flex justify-between items-center">
        <div className="flex flex-col">
            <span className="text-[10px] tracking-[0.2em] text-cyan-400 font-bold uppercase">Paw Print // AI Core</span>
            <span className="text-xs text-cyan-200/70">BIOMETRIC IDENTITY VERIFIED</span>
        </div>
        <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_cyan]"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-6 space-y-6">
        
        {/* Photo Frame */}
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-lg opacity-75 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-900 ring-1 ring-white/10">
                <img src={photoUrl} alt={pet.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                
                {/* Overlay UI elements */}
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] text-cyan-400 border border-cyan-500/30">
                    SCANNING...
                </div>
                
                {/* Corner Brackets */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500 rounded-tl-sm"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500 rounded-tr-sm"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500 rounded-bl-sm"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500 rounded-br-sm"></div>
            </div>
        </div>

        {/* Data Matrix */}
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500">Subject Name</label>
                <div className="text-xl font-bold text-white tracking-wide">{pet.name}</div>
            </div>
            <div className="space-y-1 text-right">
                <label className="text-[10px] uppercase tracking-wider text-gray-500">Identity Code</label>
                <div className="text-sm font-mono text-cyan-400 bg-cyan-950/30 px-2 py-1 rounded border border-cyan-500/30 inline-block">
                    {pet.aiIdentityCode || 'PENDING-GEN'}
                </div>
            </div>
            
            <div className="col-span-2 grid grid-cols-3 gap-2 py-4 border-t border-dashed border-gray-800">
                 <div>
                    <div className="text-[10px] text-gray-500 uppercase">Breed</div>
                    <div className="text-sm text-gray-300 truncate">{pet.breed}</div>
                 </div>
                 <div>
                    <div className="text-[10px] text-gray-500 uppercase">Age</div>
                    <div className="text-sm text-gray-300">{pet.age}</div>
                 </div>
                 <div>
                    <div className="text-[10px] text-gray-500 uppercase">Gender</div>
                    <div className="text-sm text-gray-300">{pet.gender}</div>
                 </div>
            </div>
        </div>

        {/* AI Analysis Snippet */}
        {pet.aiPhysicalDescription && (
            <div className="p-3 rounded bg-gray-900/80 border-l-2 border-fuchsia-500">
                <div className="text-[10px] text-fuchsia-400 mb-1 uppercase tracking-widest">Visual Analysis</div>
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                    {pet.aiPhysicalDescription}
                </p>
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 p-3 bg-black border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-600">
        <span>GENERATED BY GEMINI 2.5</span>
        <span className="font-mono">{new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
};
