/**
 * React Query hooks for analytics data fetching
 * Provides automatic caching, refetching, and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsAPI } from '@/lib/api-client';

/**
 * Hook for fetching trend analysis
 */
export function useTrends(labTestId: string) {
  return useQuery({
    queryKey: ['analytics', 'trends', labTestId],
    queryFn: () => analyticsAPI.getTrends(labTestId),
    enabled: !!labTestId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching correlations
 */
export function useCorrelations(labTests?: string) {
  return useQuery({
    queryKey: ['analytics', 'correlations', labTests],
    queryFn: () => analyticsAPI.getCorrelations({ labTests }),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook for fetching anomalies
 */
export function useAnomalies(labTestId: string) {
  return useQuery({
    queryKey: ['analytics', 'anomalies', labTestId],
    queryFn: () => analyticsAPI.getAnomalies(labTestId),
    enabled: !!labTestId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching predictions
 */
export function usePredictions(labTestId: string, forecastHorizon?: number) {
  return useQuery({
    queryKey: ['analytics', 'predictions', labTestId, forecastHorizon],
    queryFn: () => analyticsAPI.getPredictions(labTestId, forecastHorizon),
    enabled: !!labTestId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook for fetching statistics
 */
export function useStatistics(labTestId: string) {
  return useQuery({
    queryKey: ['analytics', 'statistics', labTestId],
    queryFn: () => analyticsAPI.getStatistics(labTestId),
    enabled: !!labTestId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching insights
 */
export function useInsights() {
  return useQuery({
    queryKey: ['analytics', 'insights'],
    queryFn: () => analyticsAPI.getInsights(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 3 * 60 * 1000, // Refetch every 3 minutes
  });
}

/**
 * Hook for fetching comprehensive analysis
 */
export function useComprehensive(labTestId: string) {
  return useQuery({
    queryKey: ['analytics', 'comprehensive', labTestId],
    queryFn: () => analyticsAPI.getComprehensive(labTestId),
    enabled: !!labTestId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for cache management
 */
export function useCacheManagement() {
  const queryClient = useQueryClient();

  const clearCacheMutation = useMutation({
    mutationFn: () => analyticsAPI.clearCache(),
    onSuccess: () => {
      // Invalidate all analytics queries
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const cacheStatsQuery = useQuery({
    queryKey: ['analytics', 'cache-stats'],
    queryFn: () => analyticsAPI.getCacheStats(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  return {
    clearCache: clearCacheMutation.mutate,
    isClearingCache: clearCacheMutation.isPending,
    cacheStats: cacheStatsQuery.data,
    isLoadingCacheStats: cacheStatsQuery.isLoading,
  };
}

/**
 * Prefetch utility hook
 */
export function usePrefetchAnalytics() {
  const queryClient = useQueryClient();

  const prefetchTrends = (labTestId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['analytics', 'trends', labTestId],
      queryFn: () => analyticsAPI.getTrends(labTestId),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchCorrelations = (labTests?: string) => {
    queryClient.prefetchQuery({
      queryKey: ['analytics', 'correlations', labTests],
      queryFn: () => analyticsAPI.getCorrelations({ labTests }),
      staleTime: 10 * 60 * 1000,
    });
  };

  return {
    prefetchTrends,
    prefetchCorrelations,
  };
}
