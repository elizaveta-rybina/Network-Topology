import { useState } from 'react';
import type { Role } from '../../types/access';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../access/permissions';
import { accounts, DEMO_PASSWORD } from '../../mocks/accessData';
import { getOrgById } from '../../access/directory';
import { authService } from '../../api/authService';
import { YadroLogo } from '../Logo/YadroLogo';
import styles from './LoginScreen.module.scss';

const ROLES: Role[] = ['org_admin', 'network_analyst', 'observer', 'security_auditor'];

export const LoginScreen = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await authService.login(login, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickLogin = async (accountLogin: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await authService.login(accountLogin, DEMO_PASSWORD);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.intro}>
          <div className={styles.introLogo}><YadroLogo size={28} /></div>
          <h1 className={styles.appTitle}>Визуализация сетевых топологий</h1>
          <p className={styles.subtitle}>
            Доступ разграничен матрицей контроля доступа: роль задаёт операции,
            атрибуты (организация, проект, сегмент) уточняют их. При отсутствии
            правила действует отказ.
          </p>
          <ul className={styles.roleList}>
            {ROLES.map((role) => (
              <li key={role} className={styles.roleItem}>
                <strong>{ROLE_LABELS[role]}</strong>
                <span>{ROLE_DESCRIPTIONS[role]}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.formSide}>
          <h2 className={styles.formTitle}>Вход в систему</h2>

          <div className={styles.demoList}>
            {accounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                className={styles.demoAccount}
                onClick={() => quickLogin(acc.login)}
                disabled={isSubmitting}
              >
                <span className={styles.demoName}>{acc.displayName}</span>
                <span className={styles.demoMeta}>
                  {ROLE_LABELS[acc.role]} · {getOrgById(acc.orgId)?.name ?? acc.orgId}
                </span>
              </button>
            ))}
          </div>

          <div className={styles.orDivider}>или войти вручную</div>

          <form className={styles.form} onSubmit={submit}>
            <label className={styles.field}>
              <span>Логин</span>
              <input
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="analyst.alfa"
                autoComplete="username"
              />
            </label>
            <label className={styles.field}>
              <span>Пароль</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="demo1234"
                autoComplete="current-password"
              />
            </label>
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? 'Проверка…' : 'Войти'}
            </button>
            <div className={styles.hint}>Демо-пароль для всех учётных записей: demo1234</div>
          </form>
        </div>
      </div>
    </div>
  );
};
