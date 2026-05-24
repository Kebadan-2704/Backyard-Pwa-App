import { useAppStore } from '../store/appStore';

export function useToast() {
  const addToast = useAppStore((s) => s.addToast);
  return {
    toast: addToast,
    success: (text: string) => addToast(text, 'success'),
    danger: (text: string) => addToast(text, 'danger'),
    info: (text: string) => addToast(text, 'info'),
    warning: (text: string) => addToast(text, 'warning'),
    celebrate: (text: string) => addToast(text, 'celebration', 4000),
  };
}
