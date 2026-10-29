import type { Core } from 'cytoscape'
import cytoscape from 'cytoscape'
import expandCollapse from 'cytoscape-expand-collapse'
import { getTopologyStyles } from '../styles/topologyStyles'
import { getFcoseLayoutConfig } from '../features/layoutConfig'

const pluginProbe = cytoscape({ elements: [] })
const hasExpandCollapse = typeof (pluginProbe as Core & { expandCollapse?: unknown }).expandCollapse === 'function'
pluginProbe.destroy()

if (!hasExpandCollapse) {
  cytoscape.use(expandCollapse)
}

export const createCytoscapeInstance = (container: HTMLDivElement, theme: 'light' | 'dark'): Core => {
  const cy = cytoscape({
    container,
    style: getTopologyStyles(theme),
    maxZoom: 5,
    minZoom: 0.1,
  })

  // сворачивание/разворачивание групп; после операции граф перезакладывается
  cy.expandCollapse({
    undoable: false,
    fisheye: false,
    animate: true,
    animationDuration: 250,
    cueEnabled: true,
    expandCollapseCueSensitivity: 8,
    layoutBy: () => {
      cy.layout(getFcoseLayoutConfig(false, false)).run()
    },
  })

  // временная отладка: доступ к инстансу из консоли
  ;(window as any).__cy = cy
  return cy
}

export default createCytoscapeInstance
