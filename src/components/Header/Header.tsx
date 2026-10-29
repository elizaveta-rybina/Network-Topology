import React from 'react'
import styles from './Header.module.scss'
import { YadroLogo } from '../Logo/YadroLogo'

interface HeaderProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  userName: string | null;
  roleLabel: string | null;
  orgName: string | null;
  canExportTopology: boolean;
  canManageOrg: boolean;
  canViewAudit: boolean;
  onExportTopology: () => void;
  onOpenAdminPanel: () => void;
  onOpenAuditPanel: () => void;
  onLogout: () => void;
}

/** Иконки переключателя темы наследуют цвет текста хедера (currentColor). */
const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
)

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

export const Header: React.FC<HeaderProps> = ({
  onZoomIn,
  onZoomOut,
  theme,
  onToggleTheme,
  userName,
  roleLabel,
  orgName,
  canExportTopology,
  canManageOrg,
  canViewAudit,
  onExportTopology,
  onOpenAdminPanel,
  onOpenAuditPanel,
  onLogout
}) => {
  return (
    <header className={styles.header}>

      <div className={styles.left}>
        <span className={styles.logo}>
          <YadroLogo />
        </span>

        {userName && (
          <div className={styles.userBlock}>
            <div className={styles.userName}>{userName}</div>
            <div className={styles.userMeta}>
              {roleLabel && <span className={styles.userRole}>{roleLabel}</span>}
              {orgName && <span className={styles.userOrg}>{orgName}</span>}
            </div>
          </div>
        )}
      </div>

      <div className={styles.toolbar}>
        {canManageOrg && (
          <button className={styles.actionButton} onClick={onOpenAdminPanel} title="Пользователи и проекты организации">
            Управление
          </button>
        )}
        {canViewAudit && (
          <button className={styles.actionButton} onClick={onOpenAuditPanel} title="Журнал событий безопасности">
            Журнал
          </button>
        )}
        {canExportTopology && (
          <button className={styles.actionButton} onClick={onExportTopology} title="Экспорт видимой топологии (аудируется)">
            Экспорт
          </button>
        )}

        <button className={styles.iconButton} onClick={onZoomOut} title="Уменьшить масштаб">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <button className={styles.iconButton} onClick={onZoomIn} title="Увеличить масштаб">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <div className={styles.divider} />

        <button className={styles.iconButton} onClick={onToggleTheme} title="Сменить тему">
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>

        {userName && (
          <>
            <div className={styles.divider} />
            <button className={styles.iconButton} onClick={onLogout} title="Выйти">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
