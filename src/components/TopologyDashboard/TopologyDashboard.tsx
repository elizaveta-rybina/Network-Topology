import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { filterTopologyData } from '../../features/filterTopology'
import { mapToCytoscapeElements } from '../../features/mapTopology'
import { useCytoscape } from '../../hooks/useCytoscape'
import { useTopologyData } from '../../hooks/useTopologyData'
import { Header } from '../Header/Header'
import styles from './TopologyDashboard.module.scss'

export const TopologyDashboard = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const { data, isLoading, error } = useTopologyData();

  const cyElements = useMemo(() => {
    if (!data) return [];
    const filters = {}; 
    const safeData = filterTopologyData(data, filters);
    return mapToCytoscapeElements(safeData);
  }, [data]);

  const { cyRef } = useCytoscape({
    containerRef,
    elements: cyElements,
  });

  const handleZoomIn = useCallback(() => {
    const cy = cyRef.current;
    if (cy) {
      cy.zoom({
        level: cy.zoom() * 1.2,
        renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 }
      });
    }
  }, [cyRef]);

  const handleZoomOut = useCallback(() => {
    const cy = cyRef.current;
    if (cy) {
      cy.zoom({
        level: cy.zoom() * 0.8,
        renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 }
      });
    }
  }, [cyRef]);

  return (
    <div className={styles.layout}>
      <Header 
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>Управление</div>
          <div style={{ color: '#acb2b9', fontSize: '0.9rem' }}>
            {isLoading ? 'Загрузка...' : `Узлов: ${data?.nodes.length || 0}`}
          </div>
        </aside>

        <main className={styles.graphArea}>
          <div ref={containerRef} className={styles.cyContainer} />

          {isLoading && (
            <div className={styles.overlay}>Загрузка топологии...</div>
          )}
          {error && (
            <div className={`${styles.overlay} ${styles.error}`}>{error}</div>
          )}
        </main>
      </div>
    </div>
  );
};