import type { ApiNode, TopologyFilterOptions, TopologyResponse } from '../types/topology';

const matchesList = (value: string, list?: string[]) => {
  return !list?.length || list.includes(value);
};

export const isNodeMatchingFilters = (nodeData: ApiNode, filters: TopologyFilterOptions): boolean => {
  const matchesState = matchesList(nodeData.state, filters.states);
  const matchesType = matchesList(nodeData.type, filters.types);
  const matchesSearch = !filters.searchQuery || 
    nodeData.label.toLowerCase().includes(filters.searchQuery.toLowerCase());

  return matchesState && matchesType && matchesSearch;
};

export const filterTopologyData = (data: TopologyResponse, filters: TopologyFilterOptions): TopologyResponse => {
  const filteredNodes = data.nodes.filter((node) => isNodeMatchingFilters(node, filters));
  const filteredNodeIds = new Set(filteredNodes.map((node) => node.id));
  
  const filteredConnections = data.connections.filter(
    (conn) => filteredNodeIds.has(conn.source) && filteredNodeIds.has(conn.target)
  );

  return { nodes: filteredNodes, connections: filteredConnections };
};