import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useEffect, type ReactNode } from 'react';
import { useThemeStore } from '@/stores/theme';

const queryClient = new QueryClient();

export function AppProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(
      'theme-light',
      'theme-dark',
      'theme-green',
      'theme-purple',
      'dark',
    );
    root.classList.add(`theme-${theme}`);
    if (theme === 'dark') {
      root.classList.add('dark');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}
