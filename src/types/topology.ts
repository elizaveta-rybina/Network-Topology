export type NodeState = 'ok' | 'warning' | 'error' | 'info';

export interface ApiNode {
  id: string;
  label: string;
  type: string;
  parent?: string;
  state: NodeState;
}

export interface ApiConnection {
  id: string;
  source: string;
  target: string;
  type: string;
}

export interface TopologyResponse {
  nodes: ApiNode[];
  connections: ApiConnection[];
}

export interface TopologyFilterOptions {
  states?: string[];
  types?: string[];
  searchQuery?: string;
}