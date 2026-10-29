import { useSyncExternalStore } from 'react';
import { authService } from '../api/authService';
import type { Account, Organization } from '../types/access';
import { getOrgById } from '../access/directory';
import { getAccessibleSegmentIds } from '../access/accessControl';
import { SEGMENT_LABELS } from '../mocks/accessData';

/**
 * Текущая сессия для интерфейса. Все решения о доступе принимает
 * серверный слой; отсюда компоненты только читают контекст пользователя.
 */
export const useSession = (): {
  account: Account | null;
  org: Organization | null;
  segmentIds: string[];
  segmentLabels: string[];
} => {
  // версия меняется при входе/выходе, повторной аутентификации
  // и при изменениях каталога администратором
  void useSyncExternalStore(authService.subscribe, authService.getVersion);

  const account = authService.getAccount();
  const org = account ? getOrgById(account.orgId) ?? null : null;
  const segmentIds = account ? getAccessibleSegmentIds(account) : [];

  return {
    account,
    org,
    segmentIds,
    segmentLabels: segmentIds.map((id) => SEGMENT_LABELS[id] ?? id),
  };
};
