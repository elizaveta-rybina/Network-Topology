import type { PublicAccount, Role } from '../types/access';
import { authorize } from '../access/accessControl';
import { AccessError } from '../access/errors';
import { logEvent } from '../access/audit';
import { authService } from './authService';
import {
  createAccountRecord,
  getAccountsOfOrg,
  getAccountById,
  getProjectsOfOrg,
  loginExists,
  updateAccountRecord,
} from '../access/directory';
import { DEMO_PASSWORD } from '../mocks/accessData';

/**
 * Операции администратора организации: только своя организация,
 * повторная аутентификация для чувствительных действий,
 * изменения ролей и прав записываются в аудит.
 */

const context = () => {
  const session = authService.getValidSession();
  const account = authService.getAccount();
  return { session, account };
};

const actorOf = (account: NonNullable<ReturnType<typeof authService.getAccount>>) => ({
  actorId: account.id,
  actorLogin: account.login,
  orgId: account.orgId,
});

const check = (
  operation: Parameters<typeof authorize>[2],
  resourceOrgId?: string,
) => {
  const { session, account } = context();
  const decision = authorize(session, account, operation, { resourceOrgId });
  if (!decision.allowed) {
    logEvent({
      actor: account && actorOf(account),
      action: 'access_denied',
      resource: operation,
      details: decision.reason ?? '',
      result: 'denied',
    });
    throw new AccessError(decision);
  }
  return account!;
};

export const adminService = {
  /** Пользователи и проекты своей организации (без секретов). */
  getOrgOverview: async (): Promise<{
    accounts: PublicAccount[];
    ownAccountId: string;
  }> => {
    await new Promise((r) => setTimeout(r, 200));
    const account = check('users:read');
    return {
      accounts: getAccountsOfOrg(account.orgId),
      ownAccountId: account.id,
    };
  },

  getOrgProjects: async () => {
    await new Promise((r) => setTimeout(r, 150));
    const account = check('projects:read');
    return getProjectsOfOrg(account.orgId);
  },

  /** Создание пользователя — только в своей организации. */
  createUser: async (input: {
    login: string;
    displayName: string;
    role: Role;
    assignedProjectIds: string[];
  }): Promise<PublicAccount> => {
    await new Promise((r) => setTimeout(r, 300));
    const account = check('users:create');

    const login = input.login.trim();
    if (!login || !input.displayName.trim()) {
      throw new Error('Укажите логин и имя пользователя');
    }
    if (loginExists(login)) {
      throw new Error('Пользователь с таким логином уже существует');
    }
    // новая учётная запись всегда относится к организации администратора
    const orgProjects = new Set(getProjectsOfOrg(account.orgId).map((p) => p.id));
    const projectIds = input.assignedProjectIds.filter((id) => orgProjects.has(id));

    const created = createAccountRecord({
      login,
      displayName: input.displayName.trim(),
      role: input.role,
      orgId: account.orgId,
      assignedProjectIds: projectIds,
      password: DEMO_PASSWORD,
    });

    logEvent({
      actor: actorOf(account),
      action: 'user_created',
      resource: `user:${created.login}`,
      details: `Роль: ${created.role}, проекты: ${projectIds.join(', ') || '—'}`,
    });
    return created;
  },

  /** Изменение роли: цель обязана быть в той же организации; аудит обязателен. */
  changeRole: async (targetAccountId: string, newRole: Role): Promise<void> => {
    await new Promise((r) => setTimeout(r, 250));
    const account = check('users:assign_rights');
    const target = getAccountById(targetAccountId);
    if (!target) throw new Error('Пользователь не найден');
    if (target.orgId !== account.orgId) {
      throw new AccessError({ allowed: false, reason: 'Пользователь принадлежит другой организации' });
    }
    if (target.role === newRole) return;

    updateAccountRecord(targetAccountId, { role: newRole });
    logEvent({
      actor: actorOf(account),
      action: 'role_changed',
      resource: `user:${target.login}`,
      details: `${target.role} → ${newRole}`,
    });
  },

  /**
   * Назначение и отзыв проектов (прав). Каждое изменение набора прав
   * фиксируется отдельным событием аудита.
   */
  setAssignedProjects: async (targetAccountId: string, projectIds: string[]): Promise<void> => {
    await new Promise((r) => setTimeout(r, 250));
    const account = check('users:assign_rights');
    const target = getAccountById(targetAccountId);
    if (!target) throw new Error('Пользователь не найден');
    if (target.orgId !== account.orgId) {
      throw new AccessError({ allowed: false, reason: 'Пользователь принадлежит другой организации' });
    }

    const orgProjects = new Set(getProjectsOfOrg(account.orgId).map((p) => p.id));
    const next = [...new Set(projectIds.filter((id) => orgProjects.has(id)))].sort();
    const prev = [...target.assignedProjectIds].sort();

    if (next.join() === prev.join()) return;

    const added = next.filter((id) => !prev.includes(id));
    const removed = prev.filter((id) => !next.includes(id));

    updateAccountRecord(targetAccountId, { assignedProjectIds: next });

    added.forEach((projectId) => {
      logEvent({
        actor: actorOf(account),
        action: 'rights_assigned',
        resource: `user:${target.login}`,
        details: `Назначен проект ${projectId}`,
      });
    });
    removed.forEach((projectId) => {
      logEvent({
        actor: actorOf(account),
        action: 'rights_revoked',
        resource: `user:${target.login}`,
        details: `Отозван проект ${projectId}`,
      });
    });
  },
};
