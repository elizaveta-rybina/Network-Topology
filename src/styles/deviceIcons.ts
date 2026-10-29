/**
 * SVG-иконки типов устройств в стиле Cisco Packet Tracer.
 * Все иконки симметричны относительно центра viewBox 64x64,
 * единая толщина линии и одинаковые отступы от края.
 */

export interface DeviceIconInfo {
  /** data URI для Cytoscape background-image и <img> в легенде. */
  src: string;
  /** Понятное название для легенды. */
  label: string;
}

const STROKE = 4;

const svgToDataUri = (body: string, accent: string): string => {
  // @a в теле иконки заменяется на акцентный цвет (точечные заливки)
  const painted = body.replace(/@a/g, accent);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" ` +
    `stroke="${accent}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">` +
    painted +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const ICONS: Record<string, { body: string; color: string; label: string }> = {
  // маршрутизатор: круг с перекрещенными двойными стрелками
  router: {
    label: 'Маршрутизатор',
    color: '#3f7ad9',
    body: `
      <circle cx="32" cy="32" r="16"/>
      <path d="M24 32 H40 M34.5 26.5 L40 32 L34.5 37.5 M29.5 26.5 L24 32 L29.5 37.5"/>
      <path d="M32 24 V40 M26.5 34.5 L32 40 L37.5 34.5 M26.5 29.5 L32 24 L37.5 29.5"/>
    `,
  },
  // коммутатор: панель со встречными стрелками
  switch: {
    label: 'Коммутатор',
    color: '#35a06b',
    body: `
      <rect x="10" y="20" width="44" height="24" rx="4"/>
      <path d="M18 27 H38 M32.5 21.5 L38 27 L32.5 32.5"/>
      <path d="M46 37 H26 M31.5 31.5 L26 37 L31.5 42.5"/>
    `,
  },
  // межсетевой экран: кирпичная кладка со смещением рядов
  firewall: {
    label: 'Межсетевой экран',
    color: '#d95b43',
    body: `
      <rect x="10" y="14" width="44" height="36"/>
      <path d="M10 26 H54 M10 38 H54"/>
      <path d="M24.7 14 V26 M39.3 14 V26"/>
      <path d="M17.3 26 V38 M32 26 V38 M46.7 26 V38"/>
      <path d="M24.7 38 V50 M39.3 38 V50"/>
    `,
  },
  // сервер: корпус со слотами, индикаторами и жалюзи
  server: {
    label: 'Сервер',
    color: '#7d8ba1',
    body: `
      <rect x="18" y="8" width="28" height="48" rx="3"/>
      <path d="M18 24 H46 M18 40 H46"/>
      <circle cx="25" cy="16" r="2" fill="@a" stroke="none"/>
      <circle cx="25" cy="32" r="2" fill="@a" stroke="none"/>
      <circle cx="25" cy="48" r="2" fill="@a" stroke="none"/>
      <path d="M33 16 H40 M33 32 H40 M33 48 H40"/>
    `,
  },
  // шлюз: облако — граница с внешней сетью
  gateway: {
    label: 'Шлюз',
    color: '#8a95a8',
    body: `
      <path d="M23 46 H43 a10.5 10.5 0 0 0 1.4-20.9 A15 15 0 0 0 15 19.6 A10.7 10.7 0 0 0 14.8 46 A11 11 0 0 0 23 46 Z"/>
    `,
  },
  // балансировщик: разделение потока на два направления
  'load-balancer': {
    label: 'Балансировщик',
    color: '#8a6fd9',
    body: `
      <path d="M32 8 V20 M32 20 L18 30 M32 20 L46 30"/>
      <path d="M18 30 V44 M46 30 V44"/>
      <rect x="10" y="44" width="16" height="10" rx="2"/>
      <rect x="38" y="44" width="16" height="10" rx="2"/>
    `,
  },
  // прокси: щит с двойными шевронами
  proxy: {
    label: 'Прокси',
    color: '#58b8a8',
    body: `
      <path d="M32 7 L51 14.5 V29 C51 41.5 42.5 50 32 57 C21.5 50 13 41.5 13 29 V14.5 Z"/>
      <path d="M26 24 L32 18 L38 24 M26 40 L32 46 L38 40"/>
    `,
  },
  // СХД: цилиндр с двумя секциями
  storage: {
    label: 'СХД',
    color: '#2fa8c9',
    body: `
      <ellipse cx="32" cy="18" rx="17" ry="7"/>
      <path d="M15 18 V46 M49 18 V46"/>
      <path d="M15 46 a17 7 0 0 0 34 0"/>
      <path d="M15 32 a17 7 0 0 0 34 0"/>
    `,
  },
  // резервное копирование: круговой обмен вокруг кассеты
  backup: {
    label: 'Резервное копирование',
    color: '#cf8a3c',
    body: `
      <path d="M21.3 23 A14 14 0 0 1 42.7 23 M42.7 16.5 V23 H36.2"/>
      <path d="M42.7 41 A14 14 0 0 1 21.3 41 M21.3 47.5 V41 H27.8"/>
      <rect x="26" y="28" width="12" height="8" rx="1.5"/>
    `,
  },
  // мониторинг: экран с кардиограммой
  monitoring: {
    label: 'Мониторинг',
    color: '#d9558f',
    body: `
      <rect x="8" y="16" width="48" height="32" rx="4"/>
      <path d="M14 32 H22 L26 23 L32 41 L36 32 H50"/>
    `,
  },
  // виртуальная машина: монитор с окном
  vm: {
    label: 'Виртуальная машина',
    color: '#6fb3e0',
    body: `
      <rect x="10" y="12" width="44" height="30" rx="3"/>
      <rect x="23" y="19" width="18" height="16" rx="2"/>
      <path d="M32 42 V50 M23 50 H41"/>
    `,
  },
  // гипервизор: три слоя виртуализации
  hypervisor: {
    label: 'Гипервизор',
    color: '#9a6fd9',
    body: `
      <rect x="16" y="11.5" width="32" height="11" rx="2.5"/>
      <rect x="16" y="26.5" width="32" height="11" rx="2.5"/>
      <rect x="16" y="41.5" width="32" height="11" rx="2.5"/>
    `,
  },
  // ленточная библиотека: кассета с двумя бобинами
  tape: {
    label: 'Ленточная библиотека',
    color: '#9099a6',
    body: `
      <rect x="8" y="20" width="48" height="24" rx="3"/>
      <circle cx="22" cy="32" r="6"/>
      <circle cx="42" cy="32" r="6"/>
      <path d="M28 32 H36"/>
    `,
  },
  // универсальное устройство (fallback)
  device: {
    label: 'Устройство',
    color: '#8a95a8',
    body: `
      <rect x="16" y="16" width="32" height="32" rx="8"/>
      <circle cx="32" cy="32" r="3.5" fill="@a" stroke="none"/>
    `,
  },
};

/** Кэш data URI по типу (иконки не зависят от темы: цветные штриховые). */
const cache = new Map<string, DeviceIconInfo>();

export const getDeviceIcon = (type: string): DeviceIconInfo => {
  const key = type || 'device';
  const known = cache.get(key);
  if (known) return known;

  const spec = ICONS[key] ?? ICONS.device;
  const info: DeviceIconInfo = {
    src: svgToDataUri(spec.body, spec.color),
    label: spec.label,
  };
  cache.set(key, info);
  return info;
};

/** Порядок легенды в сайдбаре. */
export const LEGEND_TYPES = [
  'router',
  'switch',
  'firewall',
  'gateway',
  'load-balancer',
  'proxy',
  'server',
  'storage',
  'backup',
  'monitoring',
  'hypervisor',
  'vm',
  'tape',
] as const;
