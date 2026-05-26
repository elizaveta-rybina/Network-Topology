import type { Core, ElementDefinition } from 'cytoscape'
import { useEffect, useRef, useState } from 'react'
import { getMergedPositions } from '../ utils/topologyPersistence'
import { getFcoseLayoutConfig } from '../features/layoutConfig'

export const useCytoscapeElements = (cyRef: React.RefObject<Core | null>, elements: ElementDefinition[]) => {
  const [isGraphReady, setIsGraphReady] = useState(false)
  const hasRenderedOnceRef = useRef(false)

  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    const isInitialRender = !hasRenderedOnceRef.current
    if (isInitialRender) setIsGraphReady(false)

    const { mergedPositions, currentPositions } = getMergedPositions(cy)

    cy.batch(() => {
      cy.elements().remove()
      if (elements.length > 0) {
        cy.add(elements)
        cy.nodes().forEach((node) => {
          const pos = mergedPositions[node.id()]
          if (pos) node.position(pos)
        })
      }
    })

    if (isInitialRender && elements.length > 0) {
      try {
        const currentZoom = cy.zoom()
        const newZoom = currentZoom * 1.05
        cy.zoom(newZoom)
      } catch {
      }
    }

    if (elements.length === 0) {
      setIsGraphReady(true)
      return
    }

    let needsPhysics = false
    cy.nodes().forEach((node) => {
      if (!node.isParent() && !mergedPositions[node.id()]) needsPhysics = true
    })

    let layout: any
    if (needsPhysics) {
      const isFirstLoad = Object.keys(currentPositions).length === 0
      layout = cy.layout(getFcoseLayoutConfig(isFirstLoad, false))
    } else {
      layout = cy.layout({ name: 'preset', animate: true, animationDuration: 300 })
    }

    const onStop = () => {
      setIsGraphReady(true)
      hasRenderedOnceRef.current = true
    }

    layout.on('layoutstop', onStop)
    layout.run()

    return () => {
      try {
        layout?.stop()
        layout?.off('layoutstop', onStop)
      } catch {
      }
    }
  }, [cyRef, elements])

  return { isGraphReady }
}

export default useCytoscapeElements
