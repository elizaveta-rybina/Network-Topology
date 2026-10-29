import type { AuditEvent } from '../types/access';
import { authorize } from '../access/accessControl';
import { AccessError } from '../access/errors';
import { getAuditSnapshot, logEvent } from '../access/audit';
import { authService } from './authService';

/**
 * Доступ к журналу событий: только аудитор безопасности.
 * Чтение — свободно; поиск и выгрузка фиксируются отдельными событиями.
 * Методов редактирования и удаления журнал не предоставляет вовсе.
 */

const guard = (operation: 'audit:read' | 'audit:search' | 'audit:export') => {
  const session = authService.getValidSession();
  const account = authService.getAccount();
  const decision = authorize(session, account, operation);
  if (!decision.allowed) {
    logEvent({
      actor: account && { actorId: account.id, actorLogin: account.login, orgId: account.orgId },
      action: 'access_denied',
      resource: operation,
      details: decision.reason ?? '',
      result: 'denied',
    });
    throw new AccessError(decision);
  }
  return account!;
};

export const auditService = {
  /** Список событий (свежие первыми). */
  getEvents: async (): Promise<AuditEvent[]> => {
    await new Promise((r) => setTimeout(r, 200));
    guard('audit:read');
    return [...getAuditSnapshot()].reverse();
  },

  /** Поиск по журналу — фиксируется отдельным событием аудита. */
  searchEvents: async (query: string): Promise<AuditEvent[]> => {
    await new Promise((r) => setTimeout(r, 200));
    const account = guard('audit:search');
    const q = query.trim().toLowerCase();
    const result = [...getAuditSnapshot()]
      .reverse()
      .filter((e) =>
        !q ||
        e.actorLogin.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.resource.toLowerCase().includes(q) ||
        e.details.toLowerCase().includes(q),
      );

    logEvent({
      actor: { actorId: account.id, actorLogin: account.login, orgId: account.orgId },
      action: 'audit_searched',
      resource: 'audit_log',
      details: `Запрос: «${query.trim() || '—'}», найдено: ${result.length}`,
    });
    return result;
  },

  /** Выгрузка журнала — фиксируется отдельным событием аудита. */
  exportEvents: async (): Promise<{ fileName: string; content: string }> => {
    await new Promise((r) => setTimeout(r, 200));
    const account = guard('audit:export');
    const events = getAuditSnapshot();

    logEvent({
      actor: { actorId: account.id, actorLogin: account.login, orgId: account.orgId },
      action: 'audit_exported',
      resource: 'audit_log',
      details: `Выгружено событий: ${events.length}`,
    });

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    return {
      fileName: `audit-log-${stamp}.json`,
      content: JSON.stringify(events, null, 2),
    };
  },
};
