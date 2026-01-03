import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, SnackbarProps } from '../components/ui/Snackbar';

interface SnackbarItem extends Omit<SnackbarProps, 'isOpen' | 'onClose'> {
  id: string;
}

interface SnackbarContextType {
  addSnackbar: (message: string, variant?: 'info' | 'success' | 'error', duration?: number) => void;
}

export const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const useSnackbar = () => {
  const context = React.useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};

export const SnackbarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [snackbars, setSnackbars] = useState<SnackbarItem[]>([]);

  const addSnackbar = useCallback((message: string, variant: 'info' | 'success' | 'error' = 'info', duration: number = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setSnackbars((prev) => [...prev, { id, message, variant, duration }]);
  }, []);

  const removeSnackbar = useCallback((id: string) => {
    setSnackbars((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <SnackbarContext.Provider value={{ addSnackbar }}>
      {children}
      {snackbars.map((s) => (
        <Snackbar
          key={s.id}
          message={s.message}
          isOpen={true}
          onClose={() => removeSnackbar(s.id)}
          variant={s.variant}
          duration={s.duration}
        />
      ))}
    </SnackbarContext.Provider>
  );
};
