import type { Core, ElementDefinition } from 'cytoscape'
import cytoscape from 'cytoscape'
import { useEffect, useRef } from 'react'
import { getFcoseLayoutConfig } from '../features/layoutConfig'
import { getTopologyStyles } from '../styles/topologyStyles'

interface UseCytoscapeProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  elements: ElementDefinition[];
}

export const useCytoscape = ({ containerRef, elements }: UseCytoscapeProps) => {
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
   const cy = cytoscape({
      container: containerRef.current,
      style: getTopologyStyles(),
      wheelSensitivity: 0.2,
      maxZoom: 5,
      minZoom: 0.1,
    });

    cyRef.current = cy;

		return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [containerRef]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      cy.elements().remove();

      if (elements.length > 0) {
        cy.add(elements);
      }
    });

		if (elements.length === 0) return;

		const isFirstLoad = true; 
    const hasSavedPositions = false; 

    const layoutConfig = getFcoseLayoutConfig(isFirstLoad, hasSavedPositions);
    cy.layout(layoutConfig).run();

  }, [elements]);

	return { cyRef };
};