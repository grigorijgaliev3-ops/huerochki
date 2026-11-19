const BASE = import.meta.env.BASE_URL || './';

/** Ссылка на файл из public/ (doc, video, materials). */
export function asset(path) {
  return `${BASE}${String(path).replace(/^\/+/, '')}`;
}
