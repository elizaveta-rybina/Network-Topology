import colors from './colors.module.scss'

export type CytoscapeStyle = {
  selector: string;
  style: Record<string, string | number>;
};

export const getTopologyStyles = (): CytoscapeStyle[] => {
  return [
    {
      selector: 'node',
      style: {
        'background-color': colors.bgPrimary,
        'border-width': 2,
        'border-color': colors.accentPrimary,
        label: 'data(label)',
        color: colors.textPrimary,
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 6,
        'font-size': 12,
        'font-family': 'sans-serif',
        shape: 'round-rectangle',
        width: 40,
        height: 40,
      },
    },
    {
      selector: ':parent',
      style: {
        'background-color': colors.bgPanel,
        'background-opacity': 0.3,
        'border-width': 1,
        'border-color': colors.textMuted,
        'border-style': 'dashed',
        'text-valign': 'top',
        'text-halign': 'center',
        'text-margin-y': -8,
        padding: 20,
        shape: 'round-rectangle',
      },
    },
    {
      selector: 'node[state = "ok"]',
      style: {
        'border-color': colors.statusSuccess,
      },
    },
    {
      selector: 'node[state = "error"]',
      style: {
        'border-color': colors.statusError,
        'background-color': '#ffebee',
      },
    },
    {
      selector: 'node[state = "warning"]',
      style: {
        'border-color': colors.statusWarning,
      },
    },
    {
      selector: 'node[state = "info"]',
      style: {
        'border-color': colors.statusInfo,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 2,
        'line-color': colors.textMuted,
        'target-arrow-color': colors.textMuted,
        'target-arrow-shape': 'data(type)',
        'curve-style': 'bezier',
        'arrow-scale': 1.2,
      },
    },
  ];
};
