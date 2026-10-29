import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';
import type { ApiConnection, ApiNode, TopologyResponse } from '../src/types/topology';

const storagePath = resolve(process.cwd(), 'data/topology.json');

const send = (response: ServerResponse, status: number, body: unknown) => {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
};

const readBody = async (request: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

const load = (seed: TopologyResponse): TopologyResponse => {
  if (!existsSync(storagePath)) {
    mkdirSync(dirname(storagePath), { recursive: true });
    writeFileSync(storagePath, JSON.stringify(seed, null, 2));
    return structuredClone(seed);
  }
  return JSON.parse(readFileSync(storagePath, 'utf8')) as TopologyResponse;
};

const save = (topology: TopologyResponse) => {
  mkdirSync(dirname(storagePath), { recursive: true });
  writeFileSync(storagePath, `${JSON.stringify(topology, null, 2)}\n`);
};

const isNode = (value: unknown): value is ApiNode =>
  typeof value === 'object' && value !== null &&
  typeof (value as ApiNode).id === 'string' &&
  typeof (value as ApiNode).label === 'string' &&
  typeof (value as ApiNode).type === 'string' &&
  ['ok', 'warning', 'error'].includes((value as ApiNode).state);

const isConnection = (value: unknown): value is ApiConnection =>
  typeof value === 'object' && value !== null &&
  typeof (value as ApiConnection).id === 'string' &&
  typeof (value as ApiConnection).source === 'string' &&
  typeof (value as ApiConnection).target === 'string' &&
  typeof (value as ApiConnection).type === 'string';

export const topologyApiPlugin = (seed: TopologyResponse): Plugin => ({
  name: 'topology-persistence-api',
  configureServer(server: ViteDevServer) {
    server.middlewares.use('/api', async (request, response, next) => {
      if (!request.url) return next();
      const url = new URL(request.url, 'http://localhost');
      const topology = load(seed);

      try {
        if (request.method === 'GET' && url.pathname === '/topology') {
          return send(response, 200, topology);
        }

        if (request.method === 'POST' && url.pathname === '/topology/nodes') {
          const node = await readBody(request);
          if (!isNode(node) || topology.nodes.some((item) => item.id === node.id)) {
            return send(response, 400, { message: 'Некорректный узел или такой ID уже существует' });
          }
          topology.nodes.push(node);
          save(topology);
          return send(response, 201, node);
        }

        const nodeMatch = url.pathname.match(/^\/topology\/nodes\/([^/]+)$/);
        if (request.method === 'PATCH' && nodeMatch) {
          const node = topology.nodes.find((item) => item.id === decodeURIComponent(nodeMatch[1]));
          const patch = await readBody(request);
          if (!node || typeof patch !== 'object' || patch === null) {
            return send(response, 400, { message: 'Узел или изменения не найдены' });
          }
          Object.assign(node, patch);
          if (!isNode(node)) return send(response, 400, { message: 'Некорректные данные узла' });
          save(topology);
          return send(response, 200, node);
        }

        if (request.method === 'POST' && url.pathname === '/topology/connections') {
          const connection = await readBody(request);
          if (!isConnection(connection) ||
              topology.connections.some((item) => item.id === connection.id) ||
              !topology.nodes.some((item) => item.id === connection.source) ||
              !topology.nodes.some((item) => item.id === connection.target)) {
            return send(response, 400, { message: 'Некорректная связь, узлы или ID уже существуют' });
          }
          topology.connections.push(connection);
          save(topology);
          return send(response, 201, connection);
        }

        return next();
      } catch (error) {
        return send(response, 400, { message: error instanceof Error ? error.message : 'Ошибка API' });
      }
    });
  },
});
