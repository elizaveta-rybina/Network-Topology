import type { Operation, Role } from '../types/access';

/**
 * RBAC-матрица (таблица 2): роль задаёт допустимые операции.
 * Операции, не перечисленные для роли, запрещены (default deny).
 */
export const ROLE_OPERATIONS: Record<Role, readonly Operation[]> = {
  // Администратор организации: пользователи и проекты — только своя организация,
  // повторная аутентификация, изменения ролей записываются в аудит.
  org_admin: [
    'users:read',
    'users:create',
    'users:assign_rights',
    'users:revoke',
    'projects:read',
    'projects:create',
  ],
  // Аналитик сети: топология и метрики сегментов назначенных проектов;
  // экспорт ограничен политикой организации и аудируется.
  network_analyst: ['topology:read', 'topology:filter', 'topology:export', 'topology:write'],
  // Наблюдатель: только просмотр разрешённой топологии, без импорта и экспорта.
  observer: ['topology:read'],
  // Аудитор безопасности: журнал событий — чтение и выгрузка, без изменений.
  security_auditor: ['audit:read', 'audit:search', 'audit:export'],
};

/** Операции, требующие свежей повторной аутентификации. */
export const REAUTH_OPERATIONS: readonly Operation[] = [
  'users:create',
  'users:assign_rights',
  'users:revoke',
];

export const canRole = (role: Role, operation: Operation): boolean =>
  ROLE_OPERATIONS[role].includes(operation);

export const ROLE_LABELS: Record<Role, string> = {
  org_admin: 'Администратор организации',
  network_analyst: 'Аналитик сети',
  observer: 'Наблюдатель',
  security_auditor: 'Аудитор безопасности',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  org_admin: 'Пользователи и проекты своей организации; назначение и отзыв прав; изменения ролей аудируются',
  network_analyst: 'Просмотр, фильтрация и экспорт топологии назначенных проектов; экспорт ограничен политикой организации',
  observer: 'Только просмотр назначенных проектов; без импорта, изменения и экспорта',
  security_auditor: 'Чтение, поиск и выгрузка журнала событий; без редактирования и удаления',
};
