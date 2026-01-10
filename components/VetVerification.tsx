
import React, { useState } from 'react';
import { dbService } from '../services/firebase';
import { User } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { LoadingSpinner } from './LoadingSpinner';

interface VetVerificationProps {
    user: User;
    onVerificationSubmitted: () => void;
}

export const VetVerification: React.FC<VetVerificationProps> = ({ user, onVerificationSubmitted }) => {
    const { t } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const [file, setFile] = useState<File | null>(null);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !acceptedTerms) return;

        setIsUploading(true);
        try {
            // Using user.uid in the path to match Storage security rules
            const url = await dbService.uploadImage(file, `verifications/${user.uid}/${Date.now()}_${file.name}`);
            
            const updatedUser: User = {
                ...user,
                verificationData: {
                    docUrl: url,
                    timestamp: Date.now()
                }
            };
            
            await dbService.saveUser(updatedUser);
            onVerificationSubmitted();
        } catch (error) {
            console.error("Verification upload failed:", error);
            addSnackbar(t('genericError'), 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-12 p-8 bg-card rounded-2xl shadow-xl border border-yellow-500/30">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                    🛡️
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t('vetVerificationTitle')}</h2>
                <p className="text-muted-foreground mt-2">{t('vetVerificationDesc')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-muted/30 p-6 rounded-xl border border-border">
                    <label className="block text-sm font-bold text-foreground mb-4">{t('uploadLicenseLabel')}</label>
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 border-border hover:border-primary transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-8 h-8 mb-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                <p className="text-sm text-muted-foreground"><span className="font-semibold">{t('clickToUpload')}</span> {t('dragAndDrop')}</p>
                                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (MAX. 5MB)</p>
                            </div>
                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                        </label>
                    </div>
                    {file && (
                        <div className="mt-2 text-sm text-primary font-semibold flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            {file.name}
                        </div>
                    )}
                </div>

                <div className="bg-muted/30 p-6 rounded-xl border border-border">
                    <label className="block text-sm font-bold text-foreground mb-2">{t('vetTermsTitle')}</label>
                    <div className="h-32 overflow-y-auto text-xs text-muted-foreground p-3 bg-background rounded border border-border mb-4">
                        <p><strong>{t('vetTermsHeader')}</strong></p>
                        <p>{t('vetTermsIntro')}</p>
                        <ul className="list-disc pl-4 mt-2 space-y-1">
                            <li>{t('vetTermsItem1')}</li>
                            <li>{t('vetTermsItem2')}</li>
                            <li>{t('vetTermsItem3')}</li>
                            <li>{t('vetTermsItem4')}</li>
                            <li>{t('vetTermsItem5')}</li>
                        </ul>
                    </div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary" />
                        <span className="text-sm font-medium text-foreground">{t('acceptTermsLabel')}</span>
                    </label>
                </div>

                <button 
                    type="submit" 
                    disabled={!file || !acceptedTerms || isUploading}
                    className="w-full btn btn-primary py-4 text-lg font-bold shadow-lg"
                >
                    {isUploading ? <LoadingSpinner /> : t('submitVerification')}
                </button>
            </form>
        </div>
    );
};
