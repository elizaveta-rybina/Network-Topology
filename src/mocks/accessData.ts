import type { Account, Organization, Project } from '../types/access';
import { mockTopology } from './topologyData';

/**
 * Мок-каталог доступа. В реальном развёртывании эти данные хранятся
 * в базе и доступны только серверному процессу (таблица 3: «Сервис API»).
 */

export const organizations: Organization[] = [
  {
    id: 'org-alfa',
    name: 'Альфа (основной ЦОД)',
    exportPolicy: { allowed: true, maxNodesPerExport: 40 },
  },
  {
    id: 'org-beta',
    name: 'Бета (региональный узел)',
    exportPolicy: { allowed: true, maxNodesPerExport: 8 },
  },
];

/** Сетевые сегменты: единица раздачи топологии проектам (ABAC-атрибут). */
export interface SegmentInfo {
  id: string;
  label: string;
}

export const SEGMENT_LABELS: Record<string, string> = {
  core: 'Ядро сети',
  dmz: 'DMZ',
  apps: 'Стойки приложений',
  web: 'Веб и мониторинг',
  virt: 'Виртуализация',
  storage: 'Хранение и резерв',
  spb: 'Узел СПб',
};

export const projects: Project[] = [
  { id: 'proj-alfa-net', name: 'Сеть и DMZ', orgId: 'org-alfa', segmentIds: ['core', 'dmz'] },
  { id: 'proj-alfa-apps', name: 'Приложения и веб', orgId: 'org-alfa', segmentIds: ['apps', 'web', 'virt'] },
  { id: 'proj-alfa-storage', name: 'Хранение и резервирование', orgId: 'org-alfa', segmentIds: ['storage'] },
  { id: 'proj-beta-spb', name: 'Узел СПб', orgId: 'org-beta', segmentIds: ['spb'] },
];

/**
 * Узел топологии относится к сегменту своей группы верхнего уровня
 * (стойка/зона), автономные узлы ядра перечислены явно.
 */
const ROOT_SEGMENT: Record<string, string> = {
  dmz: 'dmz',
  'rack-a1': 'apps',
  'rack-a2': 'web',
  'rack-a3': 'virt',
  'rack-b1': 'storage',
  'rack-b2': 'storage',
  spb: 'spb',
};

const TOP_LEVEL_SEGMENT: Record<string, string> = {
  'inet-gw-1': 'core',
  'inet-gw-2': 'core',
  'core-rtr-1': 'core',
  'core-rtr-2': 'core',
  'oob-sw-1': 'core',
};

const nodesById = new Map(mockTopology.nodes.map((node) => [node.id, node]));

/** Сегмент узла: поднимаемся по цепочке parent до корневой группы. */
export const getSegmentOfNode = (nodeId: string): string | undefined => {
  let current = nodesById.get(nodeId);
  const guard = new Set<string>();
  while (current && !guard.has(current.id)) {
    guard.add(current.id);
    if (TOP_LEVEL_SEGMENT[current.id]) return TOP_LEVEL_SEGMENT[current.id];
    if (!current.parent) return ROOT_SEGMENT[current.id];
    current = nodesById.get(current.parent);
  }
  return undefined;
};

/** Мок-пароль всех демо-учёток (вход и повторная аутентификация). */
export const DEMO_PASSWORD = 'demo1234';

export const accounts: Account[] = [
  {
    id: 'acc-1',
    login: 'admin.alfa',
    displayName: 'Ольга Севостьянова',
    role: 'org_admin',
    orgId: 'org-alfa',
    assignedProjectIds: ['proj-alfa-net', 'proj-alfa-apps', 'proj-alfa-storage'],
    password: DEMO_PASSWORD,
  },
  {
    id: 'acc-2',
    login: 'analyst.alfa',
    displayName: 'Пётр Смирнов',
    role: 'network_analyst',
    orgId: 'org-alfa',
    // Проект «Хранение» не назначен: сегменты хранения недоступны (ABAC)
    assignedProjectIds: ['proj-alfa-net', 'proj-alfa-apps'],
    password: DEMO_PASSWORD,
  },
  {
    id: 'acc-3',
    login: 'observer.alfa',
    displayName: 'Мария Кузнецова',
    role: 'observer',
    orgId: 'org-alfa',
    assignedProjectIds: ['proj-alfa-net'],
    password: DEMO_PASSWORD,
  },
  {
    id: 'acc-4',
    login: 'auditor.alfa',
    displayName: 'Дмитрий Орлов',
    role: 'security_auditor',
    orgId: 'org-alfa',
    assignedProjectIds: [],
    password: DEMO_PASSWORD,
  },
  {
    id: 'acc-5',
    login: 'admin.beta',
    displayName: 'Игорь Волков',
    role: 'org_admin',
    orgId: 'org-beta',
    assignedProjectIds: ['proj-beta-spb'],
    password: DEMO_PASSWORD,
  },
  {
    id: 'acc-6',
    login: 'analyst.beta',
    displayName: 'Анна Павлова',
    role: 'network_analyst',
    orgId: 'org-beta',
    assignedProjectIds: ['proj-beta-spb'],
    password: DEMO_PASSWORD,
  },
];
