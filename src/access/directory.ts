import type { Account, Organization, Project, PublicAccount } from '../types/access';
import { accounts as seedAccounts, organizations as seedOrgs, projects as seedProjects } from '../mocks/accessData';

/**
 * Мутабельное состояние каталога (играет роль базы учётных записей).
 * Изменения выполняет только серверный слой (adminService) после проверок.
 */

let orgs: Organization[] = structuredClone(seedOrgs);
let projects: Project[] = structuredClone(seedProjects);
let accounts: Account[] = structuredClone(seedAccounts);

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const subscribeDirectory = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getSnapshot = () => ({ orgs, projects, accounts });

export const getOrganizations = (): Organization[] => orgs;

export const getOrgById = (orgId: string): Organization | undefined =>
  orgs.find((org) => org.id === orgId);

/** Проекты одной организации — граница для админских операций. */
export const getProjectsOfOrg = (orgId: string): Project[] =>
  projects.filter((p) => p.orgId === orgId);

export const getProjectById = (projectId: string): Project | undefined =>
  projects.find((p) => p.id === projectId);

export const getAccountsOfOrg = (orgId: string): PublicAccount[] =>
  accounts.filter((a) => a.orgId === orgId).map(({ password: _password, ...rest }) => rest);

export const getAccountById = (accountId: string): Account | undefined =>
  accounts.find((a) => a.id === accountId);

export const getAccountByLogin = (login: string): Account | undefined =>
  accounts.find((a) => a.login === login);

const nextId = (prefix: string): string =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

export const createAccountRecord = (input: {
  login: string;
  displayName: string;
  role: Account['role'];
  orgId: string;
  assignedProjectIds: string[];
  password: string;
}): PublicAccount => {
  const account: Account = { id: nextId('acc'), ...input };
  accounts = [...accounts, account];
  emit();
  const { password: _password, ...pub } = account;
  return pub;
};

export const updateAccountRecord = (
  accountId: string,
  patch: Partial<Pick<Account, 'role' | 'assignedProjectIds' | 'displayName'>>,
): Account | undefined => {
  const target = accounts.find((a) => a.id === accountId);
  if (!target) return undefined;
  accounts = accounts.map((a) => (a.id === accountId ? { ...a, ...patch } : a));
  emit();
  return accounts.find((a) => a.id === accountId);
};

export const createProjectRecord = (input: {
  name: string;
  orgId: string;
  segmentIds: string[];
}): Project => {
  const project: Project = { id: nextId('proj'), ...input };
  projects = [...projects, project];
  emit();
  return project;
};

export const loginExists = (login: string): boolean =>
  accounts.some((a) => a.login.toLowerCase() === login.toLowerCase());

export const verifyPassword = (account: Account, password: string): boolean =>
  account.password === password;
