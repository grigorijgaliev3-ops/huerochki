const AUTH_KEY = 'huerochki:auth';
const DONE_KEY = 'huerochki:done';

export const AUTH_STORAGE_KEY = AUTH_KEY;
export const DONE_STORAGE_KEY = DONE_KEY;

export function readAuth() {
  try {
    return localStorage.getItem(AUTH_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeAuth(value) {
  try {
    if (value) localStorage.setItem(AUTH_KEY, '1');
    else localStorage.removeItem(AUTH_KEY);
  } catch {
    /* приватный режим — сессия не сохранится */
  }
}

export function readDone(lessons) {
  try {
    const raw = JSON.parse(localStorage.getItem(DONE_KEY) || '[]');
    const valid = new Set(lessons.map((lesson) => lesson.num));
    return new Set((Array.isArray(raw) ? raw : []).filter((num) => valid.has(num)));
  } catch {
    return new Set();
  }
}

export function writeDone(done) {
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify(Array.from(done)));
  } catch {
    /* ignore */
  }
}

export function checkCredentials(login, password) {
  const l = login.trim().toLowerCase();
  const p = password.trim();
  if (l === 'ir-23-4' && p === 'ir-23-4') return true;
  if (p === '23-4' && (l === 'ir' || l === 'ir-23-4')) return true;
  return false;
}

export function normalize(value) {
  return String(value).toLocaleLowerCase('ru').replace(/ё/g, 'е').trim();
}
