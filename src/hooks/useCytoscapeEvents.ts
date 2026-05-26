import type { Core } from 'cytoscape'
import type { MutableRefObject } from 'react'
import { savePositionsToStorage } from '../ utils/topologyPersistence'
import type { ApiNode, ApiConnection } from '../types/topology'

export type OnElementClickRef = MutableRefObject<((el: ApiNode | ApiConnection | null) => void) | null>

export const registerCytoscapeEvents = (cy: Core, onElementClickRef: OnElementClickRef) => {
  const savePositions = () => savePositionsToStorage(cy)

  const onTapNodeEdge = (evt: any) => {
    if (onElementClickRef?.current) onElementClickRef.current(evt.target.data())
  }

  const onTapBackground = (evt: any) => {
    if (evt.target === cy && onElementClickRef?.current) onElementClickRef.current(null)
  }

  cy.on('dragfree', 'node', savePositions)
  cy.on('layoutstop', savePositions)
  cy.on('tap', 'node, edge', onTapNodeEdge)
  cy.on('tap', onTapBackground)

  return () => {
    cy.off('dragfree', 'node', savePositions)
    cy.off('layoutstop', savePositions)
    cy.off('tap', 'node, edge', onTapNodeEdge)
    cy.off('tap', onTapBackground)
  }
}

export default registerCytoscapeEvents
