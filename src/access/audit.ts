import type { AuditAction, AuditEvent } from '../types/access';

/**
 * Журнал событий безопасности. Аудитору доступны только чтение, поиск
 * и выгрузка; отдельные события фиксируются при выгрузке и поиске.
 */

const STORAGE_KEY = 'topology_audit_log';
const MAX_EVENTS = 500;

const listeners = new Set<() => void>();
let events: AuditEvent[] = load();

function load(): AuditEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuditEvent[]) : [];
  } catch {
    return [];
  }
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    // переполнение хранилища не должно ломать приложение
  }
}

const emit = () => listeners.forEach((l) => l());

export const subscribeAudit = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getAuditSnapshot = (): AuditEvent[] => events;

let counter = 0;
const nextEventId = () => `ev-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export const logEvent = (input: {
  actor?: Pick<AuditEvent, 'actorId' | 'actorLogin' | 'orgId'> | null;
  action: AuditAction;
  resource: string;
  details: string;
  result?: AuditEvent['result'];
}): AuditEvent => {
  const event: AuditEvent = {
    id: nextEventId(),
    timestamp: Date.now(),
    actorId: input.actor?.actorId ?? null,
    actorLogin: input.actor?.actorLogin ?? 'аноним',
    orgId: input.actor?.orgId ?? null,
    action: input.action,
    resource: input.resource,
    details: input.details,
    result: input.result ?? 'allowed',
  };
  events = [...events.slice(-MAX_EVENTS + 1), event];
  persist();
  emit();
  return event;
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  login: 'Вход в систему',
  logout: 'Выход',
  login_failed: 'Неудачный вход',
  reauth: 'Повторная аутентификация',
  access_denied: 'Отказ в доступе',
  user_created: 'Создание пользователя',
  role_changed: 'Изменение роли',
  rights_assigned: 'Назначение прав',
  rights_revoked: 'Отзыв прав',
  topology_exported: 'Экспорт топологии',
  audit_searched: 'Поиск по журналу',
  audit_exported: 'Выгрузка журнала',
};
