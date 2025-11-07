
import React, { createContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface ErrorContextType {
  error: string | null;
  showError: (message: string) => void;
  clearError: () => void;
  success: string | null;
  showSuccess: (message: string) => void;
  clearSuccess: () => void;
}

export const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);
  const [errorTimeoutId, setErrorTimeoutId] = useState<number | null>(null);

  const [success, setSuccess] = useState<string | null>(null);
  const [successTimeoutId, setSuccessTimeoutId] = useState<number | null>(null);

  const clearError = useCallback(() => {
    if (errorTimeoutId) {
      clearTimeout(errorTimeoutId);
      setErrorTimeoutId(null);
    }
    setError(null);
  }, [errorTimeoutId]);

  const clearSuccess = useCallback(() => {
    if (successTimeoutId) {
      clearTimeout(successTimeoutId);
      setSuccessTimeoutId(null);
    }
    setSuccess(null);
  }, [successTimeoutId]);

  const showError = useCallback((message: string) => {
    if (successTimeoutId) clearTimeout(successTimeoutId);
    setSuccess(null);

    if (errorTimeoutId) {
      clearTimeout(errorTimeoutId);
    }
    setError(message);
    const newTimeoutId = window.setTimeout(() => {
      setError(null);
      setErrorTimeoutId(null);
    }, 5000);
    setErrorTimeoutId(newTimeoutId);
  }, [errorTimeoutId, successTimeoutId]);


  const showSuccess = useCallback((message: string) => {
    if (errorTimeoutId) clearTimeout(errorTimeoutId);
    setError(null);
    
    if (successTimeoutId) {
      clearTimeout(successTimeoutId);
    }
    setSuccess(message);
    const newSuccessTimeoutId = window.setTimeout(() => {
      setSuccess(null);
      setSuccessTimeoutId(null);
    }, 3000);
    setSuccessTimeoutId(newSuccessTimeoutId);
  }, [successTimeoutId, errorTimeoutId]);

  useEffect(() => {
    return () => {
      if (errorTimeoutId) {
        clearTimeout(errorTimeoutId);
      }
      if (successTimeoutId) {
        clearTimeout(successTimeoutId);
      }
    };
  }, [errorTimeoutId, successTimeoutId]);

  const value = { error, showError, clearError, success, showSuccess, clearSuccess };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};
