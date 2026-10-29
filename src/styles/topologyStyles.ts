import { getDeviceIcon, LEGEND_TYPES } from './deviceIcons';

const themeColors = {
  light: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f5f7f9',
    textPrimary: '#222429',
    textMuted: '#acb2b9',
    accentPrimary: '#1e22ab',
    statusSuccess: '#64a338',
    statusWarning: '#ffcc00',
    statusError: '#e03b24',
    statusErrorBg: '#ffebee',
  },
  dark: {
    bgPrimary: '#1a1b20',
    bgSecondary: '#222329',
    textPrimary: '#e4e5e7',
    textMuted: '#7b8088',
    accentPrimary: '#7b61ff',
    statusSuccess: '#64a338',
    statusWarning: '#ffcc00',
    statusError: '#e03b24',
    statusErrorBg: '#3a1f1f',
  }
};

export type CytoscapeStyle = { selector: string; style: Record<string, unknown> };

/** Узел с иконкой устройства: тип задан в data(type). */
const deviceIconStyles: CytoscapeStyle[] = [...LEGEND_TYPES, 'device'].map((type) => ({
  selector: `node[type = "${type}"]`,
  style: {
    'background-image': getDeviceIcon(type).src,
    'background-fit': 'contain' as const,
    'background-width': 34,
    'background-height': 34,
    'background-position-x': '50%',
    'background-position-y': '50%',
    'background-repeat': 'no-repeat' as const,
    'background-clip': 'node' as const,
  },
}));

export const getTopologyStyles = (theme: 'light' | 'dark' = 'light'): CytoscapeStyle[] => {
  const colors = themeColors[theme];

  return [
    {
      selector: 'node',
      style: {
        // прозрачный фон: устройство — это иконка, рамка показывает статус
        'background-color': colors.bgPrimary,
        'background-opacity': 0,
        'border-width': 2,
        'border-color': colors.statusSuccess,
        'color': colors.textPrimary,
        label: 'data(displayLabel)',
        'font-size': 12,
        'font-weight': 500,
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 6,
        // подложка подписи, чтобы текст не терялся на рёбрах
        'text-background-color': colors.bgPrimary,
        'text-background-opacity': 1,
        'text-background-padding': 3,
        'text-background-shape': 'roundrectangle',
        shape: 'round-rectangle',
        width: 58,
        height: 58,
      },
    },
    {
      selector: ':parent',
      style: {
        'background-color': colors.bgSecondary,
        'background-opacity': 0.45,
        'border-width': 1,
        'border-color': colors.accentPrimary,
        'border-style': 'dashed',
        padding: 22,
        'text-valign': 'top',
        'text-halign': 'center',
        'text-margin-y': -6,
        'font-size': 14,
        'font-weight': 'bold',
        'color': colors.accentPrimary,
        'text-background-color': colors.bgPrimary,
        'text-background-opacity': 1,
        'text-background-padding': 3,
        'text-background-shape': 'roundrectangle',
        shape: 'round-rectangle',
      },
    },
    { selector: 'node[state = "warning"]', style: { 'border-color': colors.statusWarning, 'border-width': 5, 'background-color': '#fff8d6', 'background-opacity': 0.9 } },
    { selector: 'node[state = "error"]', style: { 'border-color': colors.statusError, 'border-width': 6, 'background-color': colors.statusErrorBg, 'background-opacity': 0.95 } },
    { selector: 'node[state = "warning"]', style: { 'text-background-color': '#fff8d6', 'text-background-opacity': 1 } },
    { selector: 'node[state = "error"]', style: { 'text-background-color': colors.statusErrorBg, 'text-background-opacity': 1 } },
    { selector: 'edge[state = "warning"]', style: { 'line-color': colors.statusWarning, 'target-arrow-color': colors.statusWarning, width: 3, 'line-style': 'dashed' } },
    { selector: 'edge[state = "error"]', style: { 'line-color': colors.statusError, 'target-arrow-color': colors.statusError, width: 4 } },
    { selector: '.incident-dimmed, .story-dimmed', style: { opacity: 0.18 } },
    { selector: '.story-highlight', style: { 'border-width': 5, 'overlay-color': colors.accentPrimary, 'overlay-opacity': 0.2 } },
    { selector: '.incident-root', style: { 'border-color': colors.statusError, 'border-width': 5, 'overlay-color': colors.statusError, 'overlay-opacity': 0.18 } },
    // свёрнутая группа (стойка/зона) выглядит как узел-контейнер
    {
      selector: 'node.cy-expand-collapse-collapsed-node',
      style: {
        'background-color': colors.bgSecondary,
        'background-opacity': 1,
        'border-style': 'solid',
        'border-color': colors.accentPrimary,
        'border-width': 2,
        shape: 'round-rectangle',
        width: 72,
        height: 52,
        'font-size': 12,
      },
    },
    { selector: 'node:parent[state = "warning"]', style: { 'border-color': colors.statusWarning, 'border-width': 4, 'background-color': '#fff8d6', 'background-opacity': 0.9 } },
    { selector: 'node:parent[state = "error"]', style: { 'border-color': colors.statusError, 'border-width': 5, 'background-color': colors.statusErrorBg, 'background-opacity': 0.95 } },
    { selector: 'node.cy-expand-collapse-collapsed-node[state = "warning"]', style: { 'border-color': colors.statusWarning, 'border-width': 4, 'background-color': '#fff8d6' } },
    { selector: 'node.cy-expand-collapse-collapsed-node[state = "error"]', style: { 'border-color': colors.statusError, 'border-width': 5, 'background-color': colors.statusErrorBg } },
    {
      selector: 'edge',
      style: {
        width: 1.6,
        'line-color': colors.textMuted,
        'target-arrow-color': colors.textMuted,
        'target-arrow-shape': 'none',
        'curve-style': 'bezier',
        'arrow-scale': 0.9,
      },
    },
    { selector: 'edge[type = "arrow"], edge[type = "arrowed"]', style: { 'target-arrow-shape': 'triangle' } },
    { selector: 'edge[type = "vee"]', style: { 'target-arrow-shape': 'vee' } },
    { selector: 'edge[type = "diamond"]', style: { 'target-arrow-shape': 'diamond' } },
    { selector: 'edge[type = "circle"]', style: { 'target-arrow-shape': 'circle' } },
    { selector: 'edge[type = "square"]', style: { 'target-arrow-shape': 'square' } },
    { selector: 'edge[type = "dashed"], edge[type = "line"]', style: { 'line-style': 'dashed', 'target-arrow-shape': 'none' } },
    { selector: 'node.node-hover', style: { 'overlay-color': colors.accentPrimary, 'overlay-opacity': 0.15 } },
    {
      selector: 'node:selected',
      style: {
        'border-color': colors.accentPrimary,
        'border-width': 3,
      },
    },
    ...deviceIconStyles,
  ];
};
