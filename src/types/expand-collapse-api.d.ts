import type cytoscape from 'cytoscape';

export interface ExpandCollapseApi {
  collapse(nodes: unknown, options?: unknown): void;
  collapseRecursively(nodes: unknown, options?: unknown): void;
  collapseAll(options?: unknown): void;
  expand(nodes: unknown, options?: unknown): void;
  expandRecursively(nodes: unknown, options?: unknown): void;
  expandAll(options?: unknown): void;
  setOptions(options: Record<string, unknown>): void;
}

declare module 'cytoscape' {
  interface Core {
    expandCollapse(options?: Record<string, unknown> | string): ExpandCollapseApi;
  }
}
