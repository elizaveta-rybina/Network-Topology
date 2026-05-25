import React from 'react'
import styles from './Header.module.scss'

interface HeaderProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onZoomIn, 
  onZoomOut, 
  theme, 
  onToggleTheme 
}) => {
  return (
    <header className={styles.header}>

      <a href="/" className={styles.logo}>
				<img src="/icon.svg" alt="YADRO Logo" />
      </a>

			<div className={styles.toolbar}>
        <button className={styles.iconButton} onClick={onZoomOut} title="Уменьшить масштаб">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        
        <button className={styles.iconButton} onClick={onZoomIn} title="Увеличить масштаб">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        <div className={styles.divider} />

        <button className={styles.iconButton} onClick={onToggleTheme} title="Сменить тему">
          <img 
            src={theme === 'light' ? '/moon.svg' : '/sun.svg'} 
            alt={theme === 'light' ? "Включить темную тему" : "Включить светлую тему"}
            className={styles.themeIcon}
          />
        </button>
      </div>
    </header>
  );
};