import type { Account, Session } from '../types/access';
import { SESSION_TTL_MS, isSessionExpired } from '../access/accessControl';
import {
  getAccountById,
  getAccountByLogin,
  subscribeDirectory,
  verifyPassword,
} from '../access/directory';
import { logEvent } from '../access/audit';

/**
 * Мок аутентификации: играет роль сервера. Сессия создаётся только после
 * проверки пароля; все остальные сервисы извлекают область доступа
 * исключительно из этой сессии.
 */

interface AuthState {
  session: Session | null;
}

let state: AuthState = { session: null };
let snapshotVersion = 0;

const listeners = new Set<() => void>();
const emit = () => {
  snapshotVersion++;
  listeners.forEach((l) => l());
};

const newSessionId = () =>
  `sess-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

const actorOf = (account: Account) => ({
  actorId: account.id,
  actorLogin: account.login,
  orgId: account.orgId,
});

export const authService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Версия состояния для useSyncExternalStore. */
  getVersion: () => snapshotVersion,

  getSession(): Session | null {
    return state.session;
  },

  /** Сессия с проверкой срока; протухшая сессия сбрасывается. */
  getValidSession(): Session | null {
    if (state.session && isSessionExpired(state.session)) {
      state = { session: null };
      emit();
      return null;
    }
    return state.session;
  },

  getAccount(): Account | null {
    const session = this.getValidSession();
    if (!session) return null;
    return getAccountById(session.accountId) ?? null;
  },

  async login(login: string, password: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 350)); // имитация обращения к серверу
    const account = getAccountByLogin(login.trim());
    if (!account || !verifyPassword(account, password)) {
      logEvent({
        actor: { actorId: null, actorLogin: login, orgId: null },
        action: 'login_failed',
        resource: 'session',
        details: 'Неверный логин или пароль',
        result: 'denied',
      });
      throw new Error('Неверный логин или пароль');
    }

    const now = Date.now();
    state = {
      session: {
        id: newSessionId(),
        accountId: account.id,
        issuedAt: now,
        expiresAt: now + SESSION_TTL_MS,
        lastReAuthAt: now, // вход сам по себе подтверждает личность
      },
    };
    logEvent({
      actor: actorOf(account),
      action: 'login',
      resource: 'session',
      details: `Роль: ${account.role}`,
    });
    emit();
  },

  async logout(): Promise<void> {
    const account = this.getAccount();
    if (account) {
      logEvent({ actor: actorOf(account), action: 'logout', resource: 'session', details: '' });
    }
    state = { session: null };
    emit();
  },

  /** Повторная аутентификация: открывает окно чувствительных операций. */
  async reauthenticate(password: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 250));
    const session = this.getValidSession();
    const account = this.getAccount();
    if (!session || !account) throw new Error('Сессия не активна');
    if (!verifyPassword(account, password)) {
      logEvent({
        actor: actorOf(account),
        action: 'reauth',
        resource: 'session',
        details: 'Неверный пароль при повторной аутентификации',
        result: 'denied',
      });
      throw new Error('Неверный пароль');
    }

    state = { session: { ...session, lastReAuthAt: Date.now() } };
    logEvent({ actor: actorOf(account), action: 'reauth', resource: 'session', details: 'Подтверждено паролем' });
    emit();
  },
};

// Каталог может меняться админскими операциями — интерфейс должен перерисоваться
subscribeDirectory(() => emit());
