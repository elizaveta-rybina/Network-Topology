import type { TopologyResponse } from '../types/topology'
import { mockTopology } from '../mocks/topologyData'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)
  ?? 'http://impulse.yadro.msk.ru';

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

export const topologyService = {
  getTopology: async (): Promise<TopologyResponse> => {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);
      return structuredClone(mockTopology);
    }

    return request<TopologyResponse>(BASE_URL);
  },
};
