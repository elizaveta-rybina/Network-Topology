import type { Core } from 'cytoscape'
import type { MutableRefObject } from 'react'
import { savePositionsToStorage } from '../ utils/topologyPersistence'
import type { ApiNode, ApiConnection } from '../types/topology'

export type OnElementClickRef = MutableRefObject<((el: ApiNode | ApiConnection | null) => void) | null>

// окно распознавания двойного клика и защита от повторного срабатывания
const DOUBLE_TAP_WINDOW_MS = 500;
const TOGGLE_COOLDOWN_MS = 600;

export const registerCytoscapeEvents = (cy: Core, onElementClickRef: OnElementClickRef) => {
  const savePositions = () => savePositionsToStorage(cy)

  let lastTapNodeId: string | null = null;
  let lastTapTime = 0;
  let lastToggleNodeId: string | null = null;
  let lastToggleAt = 0;

  /** Развернуть свёрнутую группу / свернуть развёрнутую. */
  const toggleGroup = (node: any) => {
    const api = cy.expandCollapse('get');
    if (!api) return;

    const collapsed = node.hasClass('cy-expand-collapse-collapsed-node');
    if (!collapsed && !node.isParent()) return;

    const now = Date.now();
    if (lastToggleNodeId === node.id() && now - lastToggleAt < TOGGLE_COOLDOWN_MS) return;

    if (collapsed) {
      api.expandRecursively(node);
    } else {
      api.collapseRecursively(node);
    }
    lastToggleAt = now;
    lastToggleNodeId = node.id();
  };

  const onTapNodeEdge = (evt: any) => {
    if (onElementClickRef?.current) onElementClickRef.current(evt.target.data())

    // резервный распознаватель двойного клика по двум тапам
    const node = evt.target;
    const now = Date.now();
    const isDoubleTap = lastTapNodeId === node.id() && now - lastTapTime <= DOUBLE_TAP_WINDOW_MS;
    lastTapNodeId = node.id();
    lastTapTime = now;
    if (isDoubleTap) {
      lastTapNodeId = null;
      toggleGroup(node);
    }
  }

  const onTapBackground = (evt: any) => {
    if (evt.target === cy) {
      lastTapNodeId = null;
      if (onElementClickRef?.current) onElementClickRef.current(null);
    }
  }

  const onNodeMouseOver = (event: any) => event.target.addClass('node-hover')
  const onNodeMouseOut = (event: any) => event.target.removeClass('node-hover')

  // нативный dblclick: браузер применяет системный порог двойного клика,
  // поэтому медленные двойные клики тоже распознаются
  const container = cy.container();
  if (!container) return () => {};

  const onDomDblClick = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // верхний узел, содержащий точку (elementAtPoint в cytoscape отсутствует)
    let hit: any = null;
    cy.nodes().forEach((node) => {
      const bb = node.renderedBoundingBox();
      if (x >= bb.x1 && x <= bb.x2 && y >= bb.y1 && y <= bb.y2) hit = node;
    });
    if (hit) toggleGroup(hit);
  };
  container.addEventListener('dblclick', onDomDblClick);

  cy.on('dragfree', 'node', savePositions)
  cy.on('layoutstop', savePositions)
  cy.on('tap', 'node, edge', onTapNodeEdge)
  cy.on('tap', onTapBackground)
  cy.on('mouseover', 'node', onNodeMouseOver)
  cy.on('mouseout', 'node', onNodeMouseOut)

  return () => {
    container.removeEventListener('dblclick', onDomDblClick)
    cy.off('dragfree', 'node', savePositions)
    cy.off('layoutstop', savePositions)
    cy.off('tap', 'node, edge', onTapNodeEdge)
    cy.off('tap', onTapBackground)
    cy.off('mouseover', 'node', onNodeMouseOver)
    cy.off('mouseout', 'node', onNodeMouseOut)
  }
}

export default registerCytoscapeEvents
