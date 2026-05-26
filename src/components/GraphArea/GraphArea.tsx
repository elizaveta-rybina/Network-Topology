import { forwardRef } from 'react';
import styles from './GraphArea.module.scss'; 

interface GraphAreaProps {
  isGraphReady: boolean;
  isLoading: boolean;
  hasData: boolean;
  error: string | null;
}

export const GraphArea = forwardRef<HTMLDivElement, GraphAreaProps>(
  ({ isGraphReady, isLoading, hasData, error }, ref) => {
    return (
      <main className={styles.graphArea}>
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
      </main>
    );
  }
);