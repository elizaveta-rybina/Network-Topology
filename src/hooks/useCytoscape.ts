import type { Core, ElementDefinition } from 'cytoscape'
import cytoscape from 'cytoscape'
import { useEffect, useRef, useState } from 'react'
import { getFcoseLayoutConfig } from '../features/layoutConfig'
import { getTopologyStyles } from '../styles/topologyStyles'
import type { ApiConnection, ApiNode } from '../types/topology'

interface UseCytoscapeProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  elements: ElementDefinition[];
  theme?: 'light' | 'dark';
  onElementClick?: (element: ApiNode | ApiConnection | null) => void;
}

export const useCytoscape = ({ containerRef, elements, theme = 'light', onElementClick }: UseCytoscapeProps) => {
  const cyRef = useRef<Core | null>(null);
  const [isGraphReady, setIsGraphReady] = useState(false);
  const hasRenderedOnceRef = useRef(false);
  
  const onElementClickRef = useRef(onElementClick);
  useEffect(() => { onElementClickRef.current = onElementClick; }, [onElementClick]);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      style: getTopologyStyles(theme),
      wheelSensitivity: 0.2,
      maxZoom: 5,
      minZoom: 0.1,
    });

    cyRef.current = cy;

    const savePositions = () => {
      const savedRaw = localStorage.getItem('topology_positions');
      const existingPositions = savedRaw ? JSON.parse(savedRaw) : {};
      
      const currentPositions: Record<string, { x: number; y: number }> = {};
      cy.nodes().forEach((node) => {
        if (!node.isParent()) currentPositions[node.id()] = { ...node.position() };
      });

      const newCache = { ...existingPositions, ...currentPositions };
      localStorage.setItem('topology_positions', JSON.stringify(newCache));
    };

    cy.on('dragfree', 'node', savePositions);
    cy.on('layoutstop', savePositions);

    cy.on('tap', 'node, edge', (evt) => {
      if (onElementClickRef.current) onElementClickRef.current(evt.target.data());
    });
    
    cy.on('tap', (evt) => {
      if (evt.target === cy && onElementClickRef.current) onElementClickRef.current(null);
    });

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [containerRef]);

  useEffect(() => {
    if (cyRef.current) cyRef.current.style(getTopologyStyles(theme));
  }, [theme]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const isInitialRender = !hasRenderedOnceRef.current;
    if (isInitialRender) {
      setIsGraphReady(false);
    }

    const savedRaw = localStorage.getItem('topology_positions');
    const localPositions = savedRaw ? JSON.parse(savedRaw) : {};

    const currentPositions: Record<string, {x: number, y: number}> = {};
    cy.nodes().forEach(node => {
      currentPositions[node.id()] = { ...node.position() };
    });

    const mergedPositions = { ...localPositions, ...currentPositions };

    cy.batch(() => {
      cy.elements().remove();
      if (elements.length > 0) {
        cy.add(elements);
        cy.nodes().forEach(node => {
          if (mergedPositions[node.id()]) node.position(mergedPositions[node.id()]);
        });
      }
    });

    if (elements.length === 0) {
      setIsGraphReady(true);
      return;
    }

    let needsPhysics = false;
    cy.nodes().forEach(node => {
      if (!node.isParent() && !mergedPositions[node.id()]) needsPhysics = true;
    });

    let layout;
    if (needsPhysics) {
      const isFirstLoad = Object.keys(currentPositions).length === 0;
      layout = cy.layout(getFcoseLayoutConfig(isFirstLoad, false));
    } else {
      layout = cy.layout({ name: 'preset', animate: true, animationDuration: 300 });
    }

    layout.on('layoutstop', () => {
      setIsGraphReady(true);
      hasRenderedOnceRef.current = true;
    });
    
    layout.run();

  }, [elements]);

  return { cyRef, isGraphReady };
};