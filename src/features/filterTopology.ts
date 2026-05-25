import type { ApiNode, TopologyFilterOptions, TopologyResponse } from '../types/topology';

const matchesList = (value: any, list?: string[]) => {
  if (!list || list.length === 0) return true;
  return list.includes(String(value));
};

export const isNodeMatchingFilters = (nodeData: ApiNode, filters: TopologyFilterOptions): boolean => {
  const matchesState = matchesList(nodeData.state, filters.states);
  const matchesType = matchesList(nodeData.type, filters.types);
  const label = String(nodeData.label || '');
  const matchesSearch = !filters.searchQuery || 
    label.toLowerCase().includes(filters.searchQuery.toLowerCase());

  return matchesState && matchesType && matchesSearch;
};

export const filterTopologyData = (
  data: TopologyResponse, 
  filters: TopologyFilterOptions
): TopologyResponse => {
  
  const normalizedNodes = data.nodes.map((node) => ({
    ...node,
    id: String(node.id),
    parent: node.parent ? String(node.parent) : undefined,
    state: String(node.state),
    label: String(node.label),
  })) as ApiNode[];

  const nodeMap = new Map<string, ApiNode>();
  normalizedNodes.forEach((node) => nodeMap.set(node.id, node));

  const explicitlyMatchedNodes = normalizedNodes.filter((node) => isNodeMatchingFilters(node, filters));

  const finalNodeIds = new Set<string>();

  explicitlyMatchedNodes.forEach((node) => {
    let currentId: string | undefined = node.id;
    
    while (currentId && nodeMap.has(currentId)) {
      finalNodeIds.add(currentId);
      currentId = nodeMap.get(currentId)?.parent;
    }
  });

  const finalNodes = normalizedNodes.filter((node) => finalNodeIds.has(node.id));

  const finalConnections = data.connections
    .map((conn) => ({
      ...conn,
      id: String(conn.id),
      source: String(conn.source),
      target: String(conn.target),
      type: String(conn.type),
    }))
    .filter((conn) => finalNodeIds.has(conn.source) && finalNodeIds.has(conn.target));

  return { 
    nodes: finalNodes, 
    connections: finalConnections 
  };
};