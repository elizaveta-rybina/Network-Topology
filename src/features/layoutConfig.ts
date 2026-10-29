import type { EdgeSingular, NodeSingular } from 'cytoscape'
import cytoscape from 'cytoscape'
import fcose from 'cytoscape-fcose'

cytoscape.use(fcose);

export const getFcoseLayoutConfig = (isFirstLoad: boolean, hasSavedPositions: boolean) => ({
  name: 'fcose',
  animate: !isFirstLoad,
  animationDuration: isFirstLoad ? 0 : 800,

  fit: true,
  padding: 60,
  nodeDimensionsIncludeLabels: true,
  randomize: !hasSavedPositions,

  // расстояния побольше: иконки устройств не должны сливаться
  idealEdgeLength: (_edge: EdgeSingular) => 130,
  nodeRepulsion: (_node: NodeSingular) => 7500,
  gravity: 0.25,

  nestingFactor: 0.1,
  packComponents: true,
  tilingPaddingVertical: 45,
  tilingPaddingHorizontal: 45,
});