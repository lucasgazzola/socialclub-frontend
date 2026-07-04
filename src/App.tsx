import { AppRouter } from '@/routes/AppRouter';
import { Toaster } from 'sonner';

export function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <AppRouter />
    </>
  );
}
