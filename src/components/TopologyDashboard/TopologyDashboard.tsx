import { useMemo, useRef } from 'react';
import { filterTopologyData } from '../../features/filterTopology';
import { mapToCytoscapeElements } from '../../features/mapTopology';
import { useCytoscape } from '../../hooks/useCytoscape';
import { useTopologyData } from '../../hooks/useTopologyData';
import { useDashboardState } from '../../hooks/useDashboardState';
import { useGraphControls } from '../../hooks/useGraphControls';

import { Header } from '../Header/Header';
import { Sidebar } from '../SideBar/Sidebar';
import { GraphArea } from '../GraphArea/GraphArea';
import styles from './TopologyDashboard.module.scss';

export const TopologyDashboard = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, error } = useTopologyData();

  const {
    theme, toggleTheme,
    filters, handleFilterChange,
    selectedElement, setSelectedElement
  } = useDashboardState();

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

  const { handleZoomIn, handleZoomOut } = useGraphControls(cyRef);

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

        <GraphArea 
          ref={containerRef}
          isGraphReady={isGraphReady}
          isLoading={isLoading}
          hasData={!!data}
          error={error ? String(error) : null}
        />
      </div>
    </div>
  );
};