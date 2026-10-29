import type { TopologyResponse } from '../types/topology'
import { mockTopology } from '../mocks/topologyData'
import { getSegmentOfNode } from '../mocks/accessData'
import { authorize, getAccessibleSegmentIds } from '../access/accessControl'
import { AccessError } from '../access/errors'
import { logEvent } from '../access/audit'
import { authService } from './authService'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)
  ?? 'http://impulse.yadro.msk.ru';

// Мок включён по умолчанию; для работы с реальным API задайте VITE_USE_MOCK=false
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const MOCK_DELAY_MS = 600;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(url: string, config?: RequestInit): Promise<T> {
  const response = await fetch(url, config);

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`API Error: ${response.status} ${response.statusText} ${text}`);
  }

  return (await response.json()) as T;
}

const logDenied = (operation: string, reason: string) => {
  const account = authService.getAccount();
  logEvent({
    actor: account && { actorId: account.id, actorLogin: account.login, orgId: account.orgId },
    action: 'access_denied',
    resource: operation,
    details: reason,
    result: 'denied',
  });
};

/** Вырезает из топологии только узлы разрешённых сегментов (с родительскими группами). */
export const sliceTopologyBySegments = (
  topology: TopologyResponse,
  segmentIds: string[],
): TopologyResponse => {
  const allowed = new Set(segmentIds);
  const nodesById = new Map(topology.nodes.map((n) => [n.id, n]));

  const keep = new Set<string>();
  for (const node of topology.nodes) {
    const segment = getSegmentOfNode(node.id);
    if (segment && allowed.has(segment)) {
      // узел и вся цепочка родительских групп — для валидного компаунд-лейаута
      let current: string | undefined = node.id;
      while (current && nodesById.has(current)) {
        keep.add(current);
        current = nodesById.get(current)?.parent;
      }
    }
  }

  return {
    nodes: topology.nodes.filter((n) => keep.has(n.id)),
    connections: topology.connections.filter(
      (c) => keep.has(c.source) && keep.has(c.target),
    ),
  };
};

export const topologyService = {
  /**
   * Топология для текущей проверенной сессии. Область доступа (организация,
   * проекты, сегменты) определяется учётной записью на стороне сервера —
   * идентификаторы, присылаемые интерфейсом, не используются.
   */
  getTopology: async (): Promise<TopologyResponse> => {
    await delay(MOCK_DELAY_MS);

    const session = authService.getValidSession();
    const account = authService.getAccount();
    const decision = authorize(session, account, 'topology:read');
    if (!decision.allowed || !account) {
      logDenied('topology:read', decision.reason ?? 'Требуется аутентификация');
      throw new AccessError(decision);
    }

    if (USE_MOCK) {
      const segmentIds = getAccessibleSegmentIds(account);
      // Глубокая копия, чтобы потребители не мутировали мок-данные
      return structuredClone(sliceTopologyBySegments(mockTopology, segmentIds));
    }

    return request<TopologyResponse>(BASE_URL);
  },

  /**
   * Экспорт топологии: только аналитик, в рамках политики организации
   * (лимит узлов на выгрузку), каждая выгрузка аудируется.
   */
  exportTopology: async (): Promise<{ fileName: string; content: string }> => {
    await delay(MOCK_DELAY_MS / 2);

    const session = authService.getValidSession();
    const account = authService.getAccount();
    if (!account) {
      const fallback = { allowed: false, reason: 'Требуется аутентификация' } as const;
      logDenied('topology:export', fallback.reason);
      throw new AccessError(fallback);
    }

    const segmentIds = getAccessibleSegmentIds(account);
    const visible = sliceTopologyBySegments(mockTopology, segmentIds);
    const nodeCount = visible.nodes.filter((n) => !n.parent).length;

    const decision = authorize(session, account, 'topology:export', { exportNodeCount: nodeCount });
    if (!decision.allowed) {
      logDenied('topology:export', decision.reason ?? '');
      throw new AccessError(decision);
    }

    logEvent({
      actor: account && { actorId: account.id, actorLogin: account.login, orgId: account.orgId },
      action: 'topology_exported',
      resource: 'topology',
      details: `Выгружено узлов: ${nodeCount}, сегменты: ${segmentIds.join(', ') || '—'}`,
    });

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    return {
      fileName: `topology-${account!.login}-${stamp}.json`,
      content: JSON.stringify(visible, null, 2),
    };
  },
};
