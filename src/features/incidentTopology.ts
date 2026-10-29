import type { ApiConnection, ApiNode, TopologyResponse } from '../types/topology';

export type IncidentRadius = 1 | 2;

const collectAncestors = (node: ApiNode, nodesById: Map<string, ApiNode>, ids: Set<string>) => {
  let current = node.parent;
  while (current) {
    ids.add(current);
    current = nodesById.get(current)?.parent;
  }
};

const getNeighborIds = (rootId: string, connections: ApiConnection[], radius: IncidentRadius) => {
  const ids = new Set([rootId]);
  let frontier = new Set([rootId]);
  for (let depth = 0; depth < radius; depth += 1) {
    const next = new Set<string>();
    connections.forEach((connection) => {
      if (frontier.has(connection.source)) next.add(connection.target);
      if (frontier.has(connection.target)) next.add(connection.source);
    });
    next.forEach((id) => ids.add(id));
    frontier = next;
  }
  return ids;
};

export const getIncidentNodes = (data: TopologyResponse): ApiNode[] =>
  data.nodes.filter((node) => node.state !== 'ok' || node.problem);

export const getIncidentTopology = (
  data: TopologyResponse,
  rootId: string,
  radius: IncidentRadius,
): TopologyResponse => {
  const nodesById = new Map(data.nodes.map((node) => [node.id, node]));
  const ids = getNeighborIds(rootId, data.connections, radius);
  const root = nodesById.get(rootId);
  if (root) collectAncestors(root, nodesById, ids);

  data.nodes.forEach((node) => {
    if (ids.has(node.id)) collectAncestors(node, nodesById, ids);
  });

  const nodes = data.nodes.filter((node) => ids.has(node.id));
  const connections = data.connections.filter(
    (connection) => ids.has(connection.source) && ids.has(connection.target),
  );
  return { nodes, connections, story: data.story };
};
