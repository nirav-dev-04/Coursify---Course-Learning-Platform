'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 min — no re-fetch on navigation
            gcTime: 10 * 60 * 1000, // 10 min — keep data in memory
            refetchOnWindowFocus: false, // no re-fetch on tab switch
            refetchOnReconnect: false, // no burst fetch on reconnect
            retry: 1, // only retry once on failure
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
