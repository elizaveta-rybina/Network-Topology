import type { EdgeSingular, NodeSingular } from 'cytoscape'
import cytoscape from 'cytoscape'
import fcose from 'cytoscape-fcose'

cytoscape.use(fcose);

export const getFcoseLayoutConfig = (isFirstLoad: boolean, hasSavedPositions: boolean) => ({
  name: 'fcose',
  animate: !isFirstLoad,
  animationDuration: isFirstLoad ? 0 : 800,
  
  fit: true,
  padding: 50,
  nodeDimensionsIncludeLabels: true,
  randomize: !hasSavedPositions, 
  
  idealEdgeLength: (_edge: EdgeSingular) => 100,
  nodeRepulsion: (_node: NodeSingular) => 4500,
  gravity: 0.25,
  
  nestingFactor: 0.1,
  packComponents: true,
});