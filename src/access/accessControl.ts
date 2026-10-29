import type {
  AccessContext,
  AccessDecision,
  Account,
  Operation,
  Session,
} from '../types/access';
import { canRole, REAUTH_OPERATIONS } from './permissions';
import { getOrgById, getProjectById } from './directory';

/** Срок жизни сессии (ABAC-контекст «срок сессии»). */
export const SESSION_TTL_MS = 30 * 60 * 1000;
/** Окно актуальности повторной аутентификации для чувствительных операций. */
export const REAUTH_WINDOW_MS = 5 * 60 * 1000;

const DENY = (reason: string, extra?: Partial<AccessDecision>): AccessDecision => ({
  allowed: false,
  reason,
  ...extra,
});

export const isSessionExpired = (session: Session, now = Date.now()): boolean =>
  session.expiresAt <= now;

/**
 * Центральное решение по операции: субъект + действие + ресурс + контекст.
 * RBAC: роль должна явно содержать операцию, иначе отказ.
 * ABAC: организация ресурса, назначенные проекты, лимит экспорта,
 * срок сессии и свежесть повторной аутентификации.
 */
export const authorize = (
  session: Session | null,
  account: Account | null,
  operation: Operation,
  context: AccessContext = {},
  now = Date.now(),
): AccessDecision => {
  // Область доступа извлекается из проверенной учётной записи сессии,
  // а не из идентификаторов, присланных интерфейсом.
  if (!session || !account) return DENY('Требуется аутентификация');
  if (isSessionExpired(session, now)) return DENY('Сессия истекла, войдите повторно');

  if (!canRole(account.role, operation)) {
    return DENY(`Роль не имеет права на операцию «${operation}»`);
  }

  // Повторная аутентификация для чувствительных операций администратора
  if (REAUTH_OPERATIONS.includes(operation)) {
    const fresh = now - session.lastReAuthAt <= REAUTH_WINDOW_MS;
    if (!fresh) {
      return DENY('Требуется повторная аутентификация', { needsReAuth: true });
    }
  }

  // ABAC: изоляция организаций — чужие пользователи и проекты недоступны
  if (
    (operation.startsWith('users:') || operation.startsWith('projects:')) &&
    context.resourceOrgId &&
    context.resourceOrgId !== account.orgId
  ) {
    return DENY('Ресурс принадлежит другой организации');
  }

  // ABAC: экспорт топологии ограничен политикой организации
  if (operation === 'topology:export') {
    const org = getOrgById(account.orgId);
    if (!org) return DENY('Организация не найдена');
    if (!org.exportPolicy.allowed) return DENY('Экспорт запрещён политикой организации');
    if (
      context.exportNodeCount !== undefined &&
      context.exportNodeCount > org.exportPolicy.maxNodesPerExport
    ) {
      return DENY(
        `Превышен лимит экспорта: ${context.exportNodeCount} узлов при максимуме ${org.exportPolicy.maxNodesPerExport}`,
      );
    }
  }

  return { allowed: true };
};

/**
 * Сегменты, видимые учётной записи: только проекты её организации,
 * входящие в назначенные проекты. Серверная сторона область доступа.
 */
export const getAccessibleSegmentIds = (account: Account): string[] => {
  const segments = new Set<string>();
  for (const projectId of account.assignedProjectIds) {
    const project = getProjectById(projectId);
    if (project && project.orgId === account.orgId) {
      project.segmentIds.forEach((seg) => segments.add(seg));
    }
  }
  return [...segments];
};
