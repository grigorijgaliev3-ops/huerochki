const STORAGE_KEY = 'huerochki:trainer';

/** Приводит строку к виду, в котором сравниваются ответы. */
export function normalizeLine(line) {
  let value = String(line).replace(/\r/g, '').replace(/\s+/g, ' ').trim();
  if (!value) return '';
  value = value.replace(/<\?php/gi, '').replace(/\?>/g, '').trim();
  value = value.replace(/['"]/g, '"');
  value = value.replace(/\s*([=!<>+\-*/.,;:(){}[\]])\s*/g, '$1');
  return value;
}

export function splitNormalized(code) {
  return new Set(
    String(code)
      .split('\n')
      .map(normalizeLine)
      .filter(Boolean),
  );
}

export function checkTask(task, code) {
  const lines = splitNormalized(code);

  const required = task.required.map((text) => ({
    text,
    ok: lines.has(normalizeLine(text)),
  }));

  const forbidden = task.forbidden.map((text) => ({
    text,
    ok: !lines.has(normalizeLine(text)),
  }));

  const total = required.length + forbidden.length;
  const done = required.filter((row) => row.ok).length + forbidden.filter((row) => row.ok).length;

  return {
    passed: total > 0 && done === total,
    score: total ? Math.round((done / total) * 100) : 0,
    required,
    forbidden,
    missing: required.filter((row) => !row.ok).length,
    extra: forbidden.filter((row) => !row.ok).length,
  };
}

/** Прячет значения в строке для подсказки. */
export function maskLine(line) {
  return String(line)
    .replace(/(['"])(?:(?!\1).)*\1/g, '$1…$1')
    .replace(/\b\d+\b/g, '…');
}

export function taskPrompt(task) {
  const hasAdd = task.required.length > 0;
  const hasDel = task.forbidden.length > 0;
  if (hasAdd && hasDel) return 'Измени строки в файле так, как показано в уроке.';
  if (hasAdd) return 'Добавь в файл пропущенные строки.';
  if (hasDel) return 'Удали из файла лишние строки.';
  return 'Приведи файл к состоянию после урока.';
}

export function loadStats() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      solved: raw.solved && typeof raw.solved === 'object' ? raw.solved : {},
      viewed: raw.viewed && typeof raw.viewed === 'object' ? raw.viewed : {},
      attempts: Number(raw.attempts) || 0,
      streak: Number(raw.streak) || 0,
      best: Number(raw.best) || 0,
      recent: Array.isArray(raw.recent) ? raw.recent.slice(-8) : [],
    };
  } catch {
    return { solved: {}, viewed: {}, attempts: 0, streak: 0, best: 0, recent: [] };
  }
}

export function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    /* ignore */
  }
}

export function pickTask(tasks, { done, pool, recent = [], solved = {} }) {
  const fromDone = pool === 'done' ? tasks.filter((task) => done.has(task.lesson)) : [];
  const source = fromDone.length ? fromDone : tasks;
  if (!source.length) return null;

  const recentSet = new Set(recent.slice(-5));
  const fresh = source.filter((task) => !recentSet.has(task.id));
  const candidates = fresh.length ? fresh : source;

  const weighted = [];
  for (const task of candidates) {
    const weight = solved[task.id] ? 1 : 3;
    for (let i = 0; i < weight; i += 1) weighted.push(task);
  }

  return weighted[Math.floor(Math.random() * weighted.length)] || candidates[0];
}

/** Простой построчный diff для показа различий. */
export function diffLines(before, after) {
  const a = String(before).split('\n');
  const b = String(after).split('\n');
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));

  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const rows = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      rows.push({ type: 'same', text: a[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: 'del', text: a[i] });
      i += 1;
    } else {
      rows.push({ type: 'add', text: b[j] });
      j += 1;
    }
  }
  while (i < n) { rows.push({ type: 'del', text: a[i] }); i += 1; }
  while (j < m) { rows.push({ type: 'add', text: b[j] }); j += 1; }
  return rows;
}
