import type { Core, ElementDefinition } from 'cytoscape'
import { useEffect, useRef, useState } from 'react'
import { getMergedPositions } from '../ utils/topologyPersistence'
import { getFcoseLayoutConfig } from '../features/layoutConfig'

/** Группы, развернутые пользователем вручную (переживают смену фильтров). */
const expandedByUser = new WeakMap<Core, Set<string>>();

/**
 * Регистрирует учёт состояния свёрнутости: при перезагрузке элементов
 * группы сворачиваются, кроме явно развёрнутых пользователем.
 * Вызывается один раз при создании инстанса Cytoscape.
 */
export const trackExpandCollapseState = (cy: Core): void => {
  expandedByUser.set(cy, new Set());
  cy.on('expandcollapse.afterexpand', (event) => {
    expandedByUser.get(cy)?.add(event.target.id());
  });
  cy.on('expandcollapse.aftercollapse', (event) => {
    expandedByUser.get(cy)?.delete(event.target.id());
  });
};

/** Сворачивает все группы; развёрнутые вручную — восстанавливает. */
const applyInitialCollapse = (cy: Core): void => {
  const api = cy.expandCollapse('get');
  if (!api) return;

  api.collapseAll({ animate: false, layoutBy: () => {} });

  const expanded = expandedByUser.get(cy);
  if (expanded && expanded.size > 0) {
    const selector = [...expanded].map((id) => `#${id}`).join(',');
    const nodes = cy.collection(selector).filter((node) => node.nonempty());
    if (nodes.length > 0) {
      api.expandRecursively(nodes, { animate: false, layoutBy: () => {} });
    }
  }
};

export const useCytoscapeElements = (
  cyRef: React.RefObject<Core | null>,
  elements: ElementDefinition[],
  focusNodeId?: string | null,
  highlightNodeIds: string[] = [],
) => {
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
        // Полная топология начинается со свёрнутых групп. В режиме инцидента
        // все узлы области должны быть видимы сразу, иначе проблема скрывается внутри контейнера.
        if (!focusNodeId) applyInitialCollapse(cy)
        if (focusNodeId) {
          const api = cy.expandCollapse('get');
          let currentId: string | null = focusNodeId;
          while (currentId) {
            const current = cy.$id(currentId);
            const parentId = current.length > 0 ? current.parent().first().id() : '';
            if (!parentId) break;
            api?.expandRecursively(cy.$id(parentId), { animate: false, layoutBy: () => {} });
            currentId = parentId;
          }
        }
        cy.nodes().forEach((node) => {
          const pos = mergedPositions[node.id()]
          if (!focusNodeId && pos && node.visible()) node.position(pos)
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

    let needsPhysics = Boolean(focusNodeId)
    cy.nodes().forEach((node) => {
      if (!node.isParent() && !mergedPositions[node.id()]) needsPhysics = true
    })

    let layout: any
    if (needsPhysics) {
      const isFirstLoad = Boolean(focusNodeId) || Object.keys(currentPositions).length === 0
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
  }, [cyRef, elements, focusNodeId])

  useEffect(() => {
    const cy = cyRef.current
    if (!cy || highlightNodeIds.length === 0) return
    const highlighted = highlightNodeIds.reduce(
      (collection, id) => collection.union(cy.$id(id)),
      cy.collection(),
    )
    cy.elements().removeClass('story-highlight story-dimmed')
    cy.elements().difference(highlighted).addClass('story-dimmed')
    highlighted.addClass('story-highlight')
    return () => {
      cy.elements().removeClass('story-highlight story-dimmed')
    }
  }, [cyRef, highlightNodeIds, isGraphReady])

  useEffect(() => {
    const cy = cyRef.current
    if (!cy || !focusNodeId || !cy.$id(focusNodeId).length) return
    const root = cy.$id(focusNodeId)
    const focus = root.union(root.neighborhood()).union(root.parents())
    cy.elements().removeClass('incident-root incident-dimmed')
    cy.elements().difference(focus).addClass('incident-dimmed')
    root.addClass('incident-root')
    cy.fit(focus, 50)
    if (cy.zoom() < 0.3) cy.zoom(0.3)
    cy.center(focus)
    return () => {
      cy.elements().removeClass('incident-root incident-dimmed')
    }
  }, [cyRef, focusNodeId, isGraphReady])

  return { isGraphReady }
}

export default useCytoscapeElements
