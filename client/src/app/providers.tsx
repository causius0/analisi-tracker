'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect, type ReactNode } from 'react';
import { initPostHog, PHProvider } from '@/lib/analytics';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: data remains fresh for 1 minute
            staleTime: 60 * 1000,
            // Cache time: keep unused data for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Retry failed requests once
            retry: 1,
            // Refetch on window focus (can be disabled for performance)
            refetchOnWindowFocus: false,
            // Don't refetch on mount if data is fresh
            refetchOnMount: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  // Initialize PostHog on mount
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <PHProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools
            initialIsOpen={false}
          />
        )}
      </QueryClientProvider>
    </PHProvider>
  );
}
