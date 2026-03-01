import React from 'react';
import versionData from '../../version.json';

interface VersionDisplayProps {
  variant?: 'compact' | 'full' | 'badge';
  className?: string;
}

export const VersionDisplay: React.FC<VersionDisplayProps> = ({
  variant = 'compact',
  className = ''
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (variant === 'badge') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-primary/10 text-primary border border-primary/20 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
        v{versionData.version}
      </span>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">v{versionData.version}</span>
          <span className="px-2 py-0.5 rounded text-xs font-mono bg-primary/10 text-primary border border-primary/20">
            Build #{versionData.buildNumber}
          </span>
        </div>
        <div className="space-y-0.5 text-xs text-slate-400 font-mono">
          <div>
            <span className="text-slate-500">Commit:</span> {versionData.commitHash}
            {(versionData as any).branch && (
              <span className="ml-2 text-slate-600">({(versionData as any).branch})</span>
            )}
          </div>
          <div>
            <span className="text-slate-500">Date:</span> {(versionData as any).commitDate || formatDate(versionData.buildTimestamp)}
          </div>
          <div>
            <span className="text-slate-500">Built:</span> {formatDate(versionData.buildTimestamp)}
          </div>
          <div>
            <span className="text-slate-500">Env:</span> {versionData.environment}
          </div>
          {versionData.commitMessage && (
            <div className="mt-2 pt-2 border-t border-slate-800">
              <span className="text-slate-500">Latest:</span>
              <p className="mt-1 text-slate-300 text-xs">{versionData.commitMessage}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // compact variant
  return (
    <span className={`text-xs font-mono text-slate-400 ${className}`}>
      v{versionData.version}
    </span>
  );
};

// Hook to get version info
export const useVersion = () => {
  return {
    version: versionData.version,
    buildNumber: versionData.buildNumber,
    commitHash: versionData.commitHash,
    buildDate: versionData.buildTimestamp,
    environment: versionData.environment,
    isProduction: versionData.isProduction,
    formatted: `v${versionData.version}`,
    fullFormatted: `v${versionData.version} (Build #${versionData.buildNumber})`
  };
};
