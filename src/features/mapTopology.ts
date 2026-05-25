import type cytoscape from 'cytoscape';
import type { ApiConnection, TopologyResponse } from '../types/topology';

export const mapToCytoscapeElements = (data: TopologyResponse): cytoscape.ElementDefinition[] => {
  const nodeElements = data.nodes.map((node) => ({
    data: {
      id: node.id,
      label: node.label,
      state: node.state,
      type: node.type,
      parent: node.parent,
    },
  }));

  const connectionElements = data.connections.map((conn: ApiConnection) => ({
    data: {
      id: conn.id,
      source: conn.source,
      target: conn.target,
      type: conn.type,
    },
  }));

  return [...nodeElements, ...connectionElements];
};