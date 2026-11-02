import { projects, type Project } from '../data/projects';
import { services } from '../data/site';

// Only tab memory: no fetch, disk writes, cookies or browser storage.
let items = structuredClone(projects);
type Cover = {src: string; width: number; height: number};
let covers: Record<string, Cover> = {};
export const snapshot = () => ({items: structuredClone(items), covers: structuredClone(covers)});
export function resetDemo() { items = structuredClone(projects); covers = {}; }
export function assetUrl(src: string) {
 return /^(data:image\/(webp|jpeg|png);base64,|blob:)/.test(src) ? src : `${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`;
}
function image(body: Record<string, unknown>): Cover {
 const {mime, data, width, height} = body;
 if (!['image/webp','image/jpeg','image/png'].includes(String(mime)) || typeof data !== 'string' || data.length > 12000000 || !/^[A-Za-z0-9+/=]+$/.test(data)) throw Error('Imagem inválida ou muito grande.');
 if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) throw Error('Dimensões inválidas.');
 return {src: `data:${mime};base64,${data}`, width, height};
}
export async function call<T>(path: string, init?: RequestInit): Promise<T> {
 const method = init?.method ?? 'GET';
 const body: Record<string, unknown> = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
 let result: unknown;
 if (path === '/projects' && method === 'GET') result = items;
 else if (path === '/covers' && method === 'GET') result = covers;
 else if (path === '/upload' && method === 'POST') {
  if (!services.some(s => s.id === body.serviceId)) throw Error('Serviço inválido.');
  if (items.length >= 30) throw Error('Limite de 30 imagens nesta demonstração.');
  const item: Project = {id: crypto.randomUUID(), serviceId: String(body.serviceId), title: String(body.title ?? '').slice(0,120), description: String(body.description ?? '').slice(0,400), image: {...image(body), alt: String(body.alt ?? '').slice(0,200)}};
  items.push(item); result = item;
 } else if (path === '/order' && method === 'POST') {
  if (!Array.isArray(body.ids) || body.ids.length !== items.length || new Set(body.ids).size !== items.length || body.ids.some(id => !items.some(p => p.id === id))) throw Error('Ordem inválida.');
  items = body.ids.map(id => items.find(p => p.id === id)!); result = items;
 } else if (path.startsWith('/projects/')) {
  const id = path.slice('/projects/'.length), item = items.find(p => p.id === id);
  if (!item) throw Error('Imagem não encontrada.');
  if (method === 'DELETE') {items = items.filter(p => p.id !== id); result = {ok:true};}
  else if (method === 'PATCH') {
   if (!services.some(s => s.id === body.serviceId)) throw Error('Serviço inválido.');
   item.serviceId = String(body.serviceId); item.title = String(body.title ?? '').slice(0,120); item.description = String(body.description ?? '').slice(0,400); item.image.alt = String(body.alt ?? item.title).slice(0,200); result = item;
  } else throw Error('Ação indisponível.');
 } else if (path.startsWith('/covers/')) {
  const id = path.slice('/covers/'.length);
  if (!services.some(s => s.id === id)) throw Error('Serviço inválido.');
  if (method === 'POST') covers[id] = image(body);
  else if (method === 'DELETE') delete covers[id];
  else throw Error('Ação indisponível.');
  result = covers;
 } else throw Error('Ação indisponível nesta demonstração.');
 return structuredClone(result) as T;
}
