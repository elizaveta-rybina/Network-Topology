/**
 * Доменная модель контроля доступа (раздел 2 «Матрица контроля доступа»):
 * RBAC задаёт допустимые операции по роли, ABAC уточняет их атрибутами
 * (организация, проект, сетевой сегмент, срок сессии, лимит экспорта).
 */

export type Role = 'org_admin' | 'network_analyst' | 'observer' | 'security_auditor';

/** Операции из таблиц 2 и 3, доступные пользовательским ролям. */
export type Operation =
  | 'topology:read'
  | 'topology:filter'
  | 'topology:export'
  | 'users:read'
  | 'users:create'
  | 'users:assign_rights'
  | 'users:revoke'
  | 'projects:read'
  | 'projects:create'
  | 'audit:read'
  | 'audit:search'
  | 'audit:export';

export interface ExportPolicy {
  allowed: boolean;
  /** Лимит количества узлов в одной выгрузке (ABAC-контекст «лимит экспорта»). */
  maxNodesPerExport: number;
}

export interface Organization {
  id: string;
  name: string;
  exportPolicy: ExportPolicy;
}

export interface Project {
  id: string;
  name: string;
  orgId: string;
  /** Сетевые сегменты, входящие в проект. */
  segmentIds: string[];
}

export interface Account {
  id: string;
  login: string;
  displayName: string;
  role: Role;
  orgId: string;
  /** Проекты, назначенные учётной записи: определяют видимую область топологии. */
  assignedProjectIds: string[];
  /** Мок-пароль; в реальном развёртывании хранится только хеш Argon2id. */
  password: string;
}

/** Учётная запись без секрета — то, что разрешено видеть интерфейсу. */
export type PublicAccount = Omit<Account, 'password'>;

export interface Session {
  id: string;
  accountId: string;
  issuedAt: number;
  expiresAt: number;
  /** Момент последней повторной аутентификации (для чувствительных операций). */
  lastReAuthAt: number;
}

/** ABAC-контекст решения: атрибуты ресурса и субъекта. */
export interface AccessContext {
  /** Организация ресурса (целевая учётная запись, проект, топология). */
  resourceOrgId?: string;
  /** Число узлов, попадающих в выгрузку. */
  exportNodeCount?: number;
}

export interface AccessDecision {
  allowed: boolean;
  /** Причина отказа — показывается пользователю и пишется в аудит. */
  reason?: string;
  /** Отказ из-за отсутствия свежей повторной аутентификации. */
  needsReAuth?: boolean;
}

export type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'reauth'
  | 'access_denied'
  | 'user_created'
  | 'role_changed'
  | 'rights_assigned'
  | 'rights_revoked'
  | 'topology_exported'
  | 'audit_searched'
  | 'audit_exported';

export interface AuditEvent {
  id: string;
  timestamp: number;
  actorId: string | null;
  actorLogin: string;
  orgId: string | null;
  action: AuditAction;
  resource: string;
  details: string;
  result: 'allowed' | 'denied';
}
