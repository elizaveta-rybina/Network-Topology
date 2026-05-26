import { useCallback } from 'react';
import type { Core } from 'cytoscape';

export const useGraphControls = (cyRef: React.MutableRefObject<Core | null>) => {
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

  return { handleZoomIn, handleZoomOut };
};