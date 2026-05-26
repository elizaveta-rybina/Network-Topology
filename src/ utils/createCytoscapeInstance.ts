import type { Core } from 'cytoscape'
import cytoscape from 'cytoscape'
import { getTopologyStyles } from '../styles/topologyStyles'

export const createCytoscapeInstance = (container: HTMLDivElement, theme: 'light' | 'dark'): Core => {
  return cytoscape({
    container,
    style: getTopologyStyles(theme),
    wheelSensitivity: 0.2,
    maxZoom: 5,
    minZoom: 0.1,
  })
}

export default createCytoscapeInstance
