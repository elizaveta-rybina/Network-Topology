import { useState, useEffect, useCallback } from 'react';
import type { TopologyResponse } from '../types/topology';
import { topologyService } from '../api/topologyService';

export const useTopologyData = () => {
  const [data, setData] = useState<TopologyResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadTopology = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await topologyService.getTopology();
      setData(response);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Произошла неизвестная ошибка при загрузке топологии');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopology();
  }, [loadTopology]);

  return {
    data,
    isLoading,
    error,
    refetch: loadTopology,
  };
};