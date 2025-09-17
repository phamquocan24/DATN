import { useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  message: string | null;
  type: ToastType;
  show: boolean;
}

export const useToast = () => {
  const [toastState, setToastState] = useState<ToastState>({
    message: null,
    type: 'info',
    show: false
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToastState({
      message,
      type,
      show: true
    });
    setTimeout(() => {
      setToastState(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const hideToast = () => {
    setToastState(prev => ({ ...prev, show: false }));
  };

  return {
    toastState,
    showToast,
    hideToast
  };
};
