import type { TopologyResponse } from '../types/topology'
import { topologyService } from './topologyService'

export const fetchTopology = (): Promise<TopologyResponse> => topologyService.getTopology();