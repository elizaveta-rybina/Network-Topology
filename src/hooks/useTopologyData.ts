import { useCallback, useEffect, useState } from 'react';
import type { TopologyResponse } from '../types/topology';
import { topologyService } from '../api/topologyService';
import { AccessError } from '../access/errors';
import type { Account } from '../types/access';

/**
 * Загрузка топологии для текущей сессии. Отказ доступа (AccessError)
 * отделяется от ошибок сети: интерфейс показывает причину запрета.
 */
export const useTopologyData = (account: Account | null) => {
  const [data, setData] = useState<TopologyResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  // перезагрузка при смене пользователя, роли или набора проектов
  const scopeKey = account
    ? `${account.id}|${account.role}|${[...account.assignedProjectIds].sort().join(',')}`
    : '';

  const loadTopology = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAccessError(null);
    try {
      const response = await topologyService.getTopology();
      setData(response);
    } catch (err) {
      setData(null);
      if (err instanceof AccessError) {
        setAccessError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Произошла неизвестная ошибка при загрузке топологии');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!account) {
      setData(null);
      return;
    }
    loadTopology();
  }, [account, loadTopology, scopeKey]);

  return {
    data,
    isLoading,
    error,
    accessError,
    refetch: loadTopology,
  };
};
