import type { AccessDecision } from '../types/access';

/**
 * Ошибка доступа: доходит до интерфейса как причина отказа.
 * needsReAuth позволяет показать диалог повторной аутентификации.
 */
export class AccessError extends Error {
  public readonly decision: AccessDecision;

  constructor(decision: AccessDecision) {
    super(decision.reason ?? 'Доступ запрещён');
    this.name = 'AccessError';
    this.decision = decision;
  }

  get needsReAuth(): boolean {
    return this.decision.needsReAuth === true;
  }
}
