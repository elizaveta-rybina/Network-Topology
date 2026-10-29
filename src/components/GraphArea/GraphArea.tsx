import { forwardRef } from 'react';
import styles from './GraphArea.module.scss';

interface GraphAreaProps {
  isGraphReady: boolean;
  isLoading: boolean;
  hasData: boolean;
  error: string | null;
  /** Причина, по которой топология недоступна для текущей роли. */
  noAccess: string | null;
}

export const GraphArea = forwardRef<HTMLDivElement, GraphAreaProps>(
  ({ isGraphReady, isLoading, hasData, error, noAccess }, ref) => {
    return (
      <main className={styles.graphArea}>
        <div className={styles.graphLegend} aria-label="Легенда статусов">
          <span><i className={styles.legendOk} /> Норма</span>
          <span><i className={styles.legendWarning} /> Предупреждение</span>
          <span><i className={styles.legendError} /> Ошибка</span>
        </div>
        <div
          ref={ref}
          className={styles.cyContainer}
          style={{
            opacity: isGraphReady ? 1 : 0,
            transition: 'opacity 0.22s ease-out'
          }}
        />

        {(isLoading || (hasData && !isGraphReady)) && (
          <div className={styles.overlay}>Загрузка топологии...</div>
        )}
        {error && (
          <div className={`${styles.overlay} ${styles.error}`}>{error}</div>
        )}
        {!error && noAccess && (
          <div className={styles.overlay}>
            <div className={styles.noAccessTitle}>Топология недоступна</div>
            <div className={styles.noAccessText}>{noAccess}</div>
          </div>
        )}
      </main>
    );
  }
);
