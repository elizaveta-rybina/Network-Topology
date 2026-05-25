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
    statusInfo: '#87a2c7',
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
    statusInfo: '#87a2c7',
  }
};

export type CytoscapeStyle = { selector: string; style: Record<string, unknown> };

export const getTopologyStyles = (theme: 'light' | 'dark' = 'light'): CytoscapeStyle[] => {
  const colors = themeColors[theme];

  return [
    {
      selector: 'node',
      style: {
        'background-color': colors.bgPrimary,
        'border-width': 2,
        'border-color': colors.textMuted,
        'color': colors.textPrimary,
        label: 'data(label)',
        'font-size': 12,
        'font-weight': 500,
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 8,
        shape: 'round-rectangle',
        width: 48,
        height: 48,
      },
    },
    {
      selector: ':parent',
      style: {
        'background-color': colors.bgSecondary,
        'background-opacity': 0.4,
        'border-width': 1,
        'border-color': colors.accentPrimary,
        'border-style': 'dashed',
        padding: 15,
        'text-valign': 'top',
        'text-halign': 'center',
        'text-margin-y': -8,
        'font-size': 14,
        'font-weight': 'bold',
        'color': colors.accentPrimary,
        shape: 'round-rectangle',
      },
    },
    { selector: 'node[state = "ok"]', style: { 'border-color': colors.statusSuccess } },
    { selector: 'node[state = "warning"]', style: { 'border-color': colors.statusWarning } },
    { selector: 'node[state = "error"]', style: { 'border-color': colors.statusError, 'border-width': 3, 'background-color': '#ffebee' } },
    { selector: 'node[state = "info"]', style: { 'border-color': colors.statusInfo } },
    {
      selector: 'edge',
      style: {
        width: 2,
        'line-color': colors.textMuted,
        'target-arrow-color': colors.textMuted,
        'target-arrow-shape': 'none',
        'curve-style': 'bezier',
        'arrow-scale': 1.2,
      },
    },
    { selector: 'edge[type = "arrow"], edge[type = "arrowed"]', style: { 'target-arrow-shape': 'triangle' } },
    { selector: 'edge[type = "vee"]', style: { 'target-arrow-shape': 'vee' } },
    { selector: 'edge[type = "diamond"]', style: { 'target-arrow-shape': 'diamond' } },
    { selector: 'edge[type = "circle"]', style: { 'target-arrow-shape': 'circle' } },
    { selector: 'edge[type = "square"]', style: { 'target-arrow-shape': 'square' } },
    { selector: 'edge[type = "dashed"], edge[type = "line"]', style: { 'line-style': 'dashed', 'target-arrow-shape': 'none' } },
  ];
};