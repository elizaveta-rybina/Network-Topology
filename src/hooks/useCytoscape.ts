import type { Core, ElementDefinition } from 'cytoscape'
import { useEffect, useRef } from 'react'
import createCytoscapeInstance from '../ utils/createCytoscapeInstance'
import type { ApiConnection, ApiNode } from '../types/topology'
import useCytoscapeElements from './useCytoscapeElements'
import registerCytoscapeEvents from './useCytoscapeEvents'

interface UseCytoscapeProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  elements: ElementDefinition[]
  theme?: 'light' | 'dark'
  onElementClick?: (element: ApiNode | ApiConnection | null) => void
}

export const useCytoscape = ({ containerRef, elements, theme = 'light', onElementClick }: UseCytoscapeProps) => {
  const cyRef = useRef<Core | null>(null)
  const onElementClickRef = useRef<((el: ApiNode | ApiConnection | null) => void) | null>(null)
  useEffect(() => { onElementClickRef.current = onElementClick ?? null }, [onElementClick])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const cy = createCytoscapeInstance(container, theme)
    cyRef.current = cy

    const unregister = registerCytoscapeEvents(cy, onElementClickRef)

    return () => {
      try { unregister() } catch {}
      try { cy.destroy() } catch {}
      cyRef.current = null
    }
  }, [containerRef])

  useEffect(() => {
    let mounted = true
    const cy = cyRef.current
    if (!cy) return

    ;(async () => {
      try {
        const mod = await import('../styles/topologyStyles')
        if (!mounted) return
        cy.style(mod.getTopologyStyles(theme))
      } catch {
      }
    })()

    return () => { mounted = false }
  }, [theme])

  const { isGraphReady } = useCytoscapeElements(cyRef, elements)

  return { cyRef, isGraphReady }
}

export default useCytoscape