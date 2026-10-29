export type NodeState = 'ok' | 'warning' | 'error';
export type ConnectionState = 'ok' | 'warning' | 'error';

export interface ProblemInfo {
  title: string;
  description?: string;
  detectedAt?: number;
  source?: string;
}

export interface ApiNode {
  id: string;
  label: string;
  type: string;
  parent?: string;
  state: NodeState;
  problem?: ProblemInfo;
}

export interface ApiConnection {
  id: string;
  source: string;
  target: string;
  type: string;
  state?: ConnectionState;
  problem?: ProblemInfo;
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