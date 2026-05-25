import type { TopologyResponse } from '../types/topology'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)
  ?? 'http://impulse.yadro.msk.ru';

async function request<T>(url: string, config?: RequestInit): Promise<T> {
  const response = await fetch(url, config);

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`API Error: ${response.status} ${response.statusText} ${text}`);
  }

  return (await response.json()) as T;
}

export const topologyService = {
  getTopology: (): Promise<TopologyResponse> => {
    return request<TopologyResponse>(BASE_URL);
  },
};