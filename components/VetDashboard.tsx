
import React from 'react';
import { View, User } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { Appointment } from '../types';
import { VetVerification } from './VetVerification';

interface VetDashboardProps {
  user: User;
  setView: (view: View) => void;
  pendingPatientCount: number;
  pendingAppointmentCount: number;
  confirmedPatientCount: number;
  todaysAppointments: Appointment[];
}

const StatWidget: React.FC<{ title: string; value: number; icon: React.ReactNode; colorClass: string; onClick: () => void }> = ({ title, value, icon, colorClass, onClick }) => (
    <div onClick={onClick} className="glass-panel p-6 rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/20 flex items-center justify-center md:justify-between group text-center md:text-left">
        <div>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
            <h3 className="text-4xl font-bold text-foreground tracking-tight">{value}</h3>
        </div>
        <div className={`p-4 rounded-xl ${colorClass} group-hover:scale-110 transition-transform hidden md:block`}>
            {icon}
        </div>
    </div>
);

const ActionCard: React.FC<{ title: string; description: string; onClick: () => void; icon: React.ReactNode }> = ({ title, description, onClick, icon }) => (
    <div onClick={onClick} className="bg-card p-5 rounded-2xl border border-border cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-4 group">
        <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            {icon}
        </div>
        <div>
            <h4 className="font-bold text-foreground text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="ml-auto text-muted-foreground group-hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
        </div>
    </div>
);

export const VetDashboard: React.FC<VetDashboardProps> = ({ user, setView, pendingPatientCount, pendingAppointmentCount, confirmedPatientCount, todaysAppointments }) => {
  const { t } = useTranslations();

  // 1. Check if verified
  if (!user.isVerified) {
      // 2. Check if submitted
      if (user.verificationData) {
          return (
              <div className="max-w-2xl mx-auto mt-20 p-8 bg-card rounded-2xl shadow-xl text-center border border-yellow-500/30 animate-fade-in">
                  <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-pulse">
                      ⏳
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Verification In Progress</h2>
                  <p className="text-muted-foreground">We have received your documents and are currently reviewing your application. You will receive an email once your account is approved.</p>
                  <p className="text-xs text-muted-foreground mt-6">Submitted on: {new Date(user.verificationData.timestamp).toLocaleDateString()}</p>
              </div>
          );
      }
      
      // 3. Show Verification Form
      return <VetVerification user={user} onVerificationSubmitted={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 to-cyan-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px]"></div>
          <div className="relative z-10">
             <div className="flex items-center gap-2 mb-2 opacity-80">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.761 2.156 18 5.402 18h9.196c3.246 0 4.585-3.239 2.707-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" /></svg>
                <span className="text-sm font-bold uppercase tracking-wider">Practice Portal</span>
             </div>
             <h1 className="text-3xl font-bold">{t('vetDashboardTitle')}</h1>
             <p className="text-teal-100 mt-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex gap-3 relative z-10">
             <button onClick={() => setView('smartCalendar')} className="btn bg-white text-teal-800 hover:bg-teal-50 font-bold shadow-lg flex items-center gap-2">
                <span>+ {t('newAppointmentTitle')}</span>
             </button>
          </div>
      </header>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatWidget 
            title={t('pendingRequests')} 
            value={pendingPatientCount} 
            onClick={() => setView('myPatients')}
            colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
          />
           <StatWidget 
            title={t('pendingAppointmentsStat')} 
            value={pendingAppointmentCount} 
            onClick={() => setView('smartCalendar')}
            colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          />
           <StatWidget 
            title={t('confirmedPatients')} 
            value={confirmedPatientCount} 
            onClick={() => setView('myPatients')}
            colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-primary rounded-full"></span>
                {t('todaysScheduleTitle')}
            </h3>
            {todaysAppointments.length > 0 ? (
                <div className="space-y-3">
                    {todaysAppointments.sort((a, b) => a.time.localeCompare(b.time)).map(app => (
                        <div key={app.id} className="flex items-center gap-4 p-4 bg-card/50 rounded-xl border border-border/50 hover:border-primary/30 transition-all hover:bg-card">
                            <div className="flex-shrink-0 w-20 text-center bg-primary/5 rounded-lg py-2 border border-primary/10">
                                <p className="font-bold text-lg text-primary">{app.time}</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground text-lg">{app.petName}</h4>
                                <p className="text-sm text-muted-foreground">{app.notes || t('generalCheckup')}</p>
                            </div>
                            <div className="ml-auto">
                                <span className="px-3 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full uppercase tracking-wide flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    {t('confirmedStatus')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed border-border flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-muted-foreground font-medium">{t('noAppointmentsToday')}</p>
                    <p className="text-xs text-muted-foreground mt-1">Enjoy your free time!</p>
                </div>
            )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
             <h3 className="text-xl font-bold text-foreground mb-4 px-2">{t('quickActionsTitle')}</h3>
             <ActionCard 
                title={t('manageClinicNav')} 
                description="Update contact info & hours" 
                onClick={() => setView('myClinic')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
             />
              <ActionCard 
                title={t('managePatientsNav')} 
                description="View records & history" 
                onClick={() => setView('myPatients')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
             />
             <ActionCard 
                title={t('smartCalendarNav')} 
                description="Manage schedule & AI tools" 
                onClick={() => setView('smartCalendar')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
             />
        </div>
      </div>
    </div>
  );
};
