import { forwardRef } from 'react';
import type { TopologyStory } from '../../types/topology';
import styles from './GraphArea.module.scss';

interface GraphAreaProps {
  isGraphReady: boolean;
  isLoading: boolean;
  hasData: boolean;
  error: string | null;
  /** Причина, по которой топология недоступна для текущей роли. */
  noAccess: string | null;
  story?: TopologyStory;
  showStory?: boolean;
  storyStep?: string;
}

export const GraphArea = forwardRef<HTMLDivElement, GraphAreaProps>(
  ({ isGraphReady, isLoading, hasData, error, noAccess, story, showStory = true, storyStep = 'overview' }, ref) => {
    return (
      <main className={styles.graphArea}>
        <div className={styles.graphLegend} aria-label="Легенда статусов">
          <span><i className={styles.legendOk} /> Норма</span>
          <span><i className={styles.legendWarning} /> Предупреждение</span>
          <span><i className={styles.legendError} /> Ошибка</span>
        </div>
        {showStory && story && (
          <section className={styles.storyCard} aria-label="Разбор текущего инцидента">
            <div className={styles.storyEyebrow}>Текущий инцидент · {story.service}</div>
            <h2>{story.headline}</h2>
            <p className={styles.storySummary}>{story.description}</p>
            <div className={styles.storyMetrics} aria-label="Ключевые показатели инцидента">
              <div className={styles.storyMetricError}>
                <strong>{story.metrics.errors}</strong>
                <span>ошибка</span>
              </div>
              <div>
                <strong>{story.metrics.affectedComponents}</strong>
                <span>затронутый компонент</span>
              </div>
              <div className={styles.storyMetricAvailable}>
                <strong>✓</strong>
                <span>{story.metrics.availability}</span>
              </div>
            </div>
            <div className={styles.storyPath} aria-label="Путь запроса">
              {story.path.map((step, index) => (
                <span key={step}>
                  <b className={index === story.path.length - 1 ? styles.storyPathProblem : ''}>{step}</b>
                  {index < story.path.length - 1 && <i aria-hidden="true">→</i>}
                </span>
              ))}
            </div>
            <div className={styles.storyFacts}>
              <div><strong>Причина</strong><span>{story.rootCause}</span></div>
              <div><strong>Что затронуто</strong><span>{story.impact}</span></div>
              <div><strong>Почему работает</strong><span>{story.availability}</span></div>
            </div>
            <div className={styles.storyAction}><strong>Следующий шаг:</strong> {story.nextAction}</div>
            {storyStep !== 'overview' && <div className={styles.storyStepHint}>Сейчас на карте подсвечен шаг расследования: {storyStep === 'path' ? 'путь запроса' : storyStep === 'failure' ? 'место ошибки' : storyStep === 'backup' ? 'резервный путь' : 'затронутые компоненты'}.</div>}
          </section>
        )}
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
            <div className={styles.noAccessContent}>
              <div className={styles.noAccessTitle}>Топология недоступна</div>
              <div className={styles.noAccessText}>{noAccess}</div>
            </div>
          </div>
        )}
      </main>
    );
  }
);
