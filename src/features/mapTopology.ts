import type cytoscape from 'cytoscape';
import type { ApiConnection, ApiNode, TopologyResponse } from '../types/topology';

const getNodeStatus = (node: ApiNode, nodes: ApiNode[]): ApiNode['state'] => {
  const descendants = nodes.filter((candidate) => {
    let parent = candidate.parent;
    while (parent) {
      if (parent === node.id) return true;
      parent = nodes.find((item) => item.id === parent)?.parent;
    }
    return false;
  });
  if (node.state === 'error' || descendants.some((item) => item.state === 'error')) return 'error';
  if (node.state === 'warning' || descendants.some((item) => item.state === 'warning')) return 'warning';
  return 'ok';
};

export const mapToCytoscapeElements = (data: TopologyResponse): cytoscape.ElementDefinition[] => {
  const nodeElements = data.nodes.map((node) => {
    const state = getNodeStatus(node, data.nodes);
    const problemCount = data.nodes.filter((item) => {
      let parent = item.parent;
      while (parent) {
        if (parent === node.id) return item.state !== 'ok';
        parent = data.nodes.find((candidate) => candidate.id === parent)?.parent;
      }
      return false;
    }).length;

    return {
      data: {
        id: node.id,
        label: node.label,
        displayLabel: problemCount > 0 ? `${node.label}  [${state === 'error' ? '×' : '!'} ${problemCount}]` : node.label,
        state,
        type: node.type,
        parent: node.parent,
        problem: node.problem,
        problemCount,
      },
    };
  });

  const connectionElements = data.connections.map((conn: ApiConnection) => ({
    data: {
      id: conn.id,
      source: conn.source,
      target: conn.target,
      type: conn.type,
      state: conn.state ?? 'ok',
      problem: conn.problem,
    },
  }));

  return [...nodeElements, ...connectionElements];
};