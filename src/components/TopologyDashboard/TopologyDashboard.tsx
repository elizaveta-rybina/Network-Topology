import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { filterTopologyData } from '../../features/filterTopology'
import { mapToCytoscapeElements } from '../../features/mapTopology'
import { useCytoscape } from '../../hooks/useCytoscape'
import { useTopologyData } from '../../hooks/useTopologyData'
import type { ApiConnection, ApiNode, TopologyFilterOptions } from '../../types/topology'
import { Header } from '../Header/Header'
import { Sidebar } from '../SideBar/Sidebar'
import styles from './TopologyDashboard.module.scss'

export const TopologyDashboard = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const [selectedElement, setSelectedElement] = useState<ApiNode | ApiConnection | null>(null);

  const [filters, setFilters] = useState<TopologyFilterOptions>({
    searchQuery: '',
    states: [],
    types: [],
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const { data, isLoading, error } = useTopologyData();

  const cyElements = useMemo(() => {
    if (!data) return [];
    const safeData = filterTopologyData(data, filters);
    return mapToCytoscapeElements(safeData);
  }, [data, filters]);

  const { cyRef, isGraphReady } = useCytoscape({
    containerRef,
    elements: cyElements,
    theme,
    onElementClick: setSelectedElement,
  });

  const handleFilterChange = useCallback((newFilters: TopologyFilterOptions) => {
    setFilters(newFilters);
    setSelectedElement(null); 
  }, []);

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
        <Sidebar 
          isLoading={isLoading} 
          nodesCount={cyElements.filter(e => e.data && !e.data.source).length}
          filters={filters}
          onFilterChange={handleFilterChange}
          selectedElement={selectedElement}
        />

        <main className={styles.graphArea}>
          <div 
            ref={containerRef} 
            className={styles.cyContainer} 
            style={{ 
              opacity: isGraphReady ? 1 : 0, 
              transition: 'opacity 0.6s ease-in-out' 
            }} 
          />
         
          {(isLoading || (data && !isGraphReady)) && (
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