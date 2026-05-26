import type { Core } from 'cytoscape'

type Position = { x: number; y: number };
type PosMap = Record<string, Position>;

const STORAGE_KEY = 'topology_positions';

const loadStoredPositions = (): PosMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PosMap) : {};
  } catch {
    return {};
  }
};

const saveStoredPositions = (map: PosMap) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
  }
};

export const savePositionsToStorage = (cy: Core): void => {
  const existing = loadStoredPositions();
  const current: PosMap = {};

  cy.nodes().forEach((node) => {
    if (!node.isParent()) {
      const p = node.position();
      current[node.id()] = { x: p.x, y: p.y };
    }
  });

  saveStoredPositions({ ...existing, ...current });
};

export const getMergedPositions = (cy: Core): { mergedPositions: PosMap; currentPositions: PosMap } => {
  const stored = loadStoredPositions();
  const current: PosMap = {};

  cy.nodes().forEach((node) => {
    const p = node.position();
    current[node.id()] = { x: p.x, y: p.y };
  });

  return { mergedPositions: { ...stored, ...current }, currentPositions: current };
};