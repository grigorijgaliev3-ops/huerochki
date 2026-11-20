/**
 * Собирает билеты для тренажёра из веток репозитория korochki.
 *
 * Каждая ветка (001, 003, ... 075) — состояние проекта после урока.
 * Берём коммиты урока (их может быть несколько), сравниваем с родителем
 * самого раннего из них и достаём изменённые строки реального кода.
 *
 * Результат: src/data/trainer.json
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { normalizeLine } from '../src/lib/trainer.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const REPO_URL = 'https://github.com/Tmpgmv/korochki.git';
const CACHE = path.join(ROOT, '.cache', 'korochki');
const LESSONS = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'lessons.json'), 'utf8'));
const OUT = path.join(ROOT, 'src', 'data', 'trainer.json');

const ALLOWED_EXT = new Set(['.php', '.js', '.css', '.sql']);
const SKIP_PATH = [
  /^vendor\//i,
  /^runtime\//i,
  /^web\/assets\//i,
  /^doc\//i,
  /^tests\//i,
  /^mail\//i,
  /^\.pkgh\//i,
  /(^|\/)README/i,
  /composer\.(json|lock)$/i,
  /\.min\.(js|css)$/i,
  /(^|\/)_?console\.php$/i,
];

function git(args) {
  return execFileSync('git', ['-C', CACHE, ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function ensureRepo() {
  if (!fs.existsSync(path.join(CACHE, '.git'))) {
    fs.mkdirSync(path.dirname(CACHE), { recursive: true });
    console.log('Клонирую korochki...');
    execFileSync('git', ['clone', '--quiet', REPO_URL, CACHE], { stdio: 'inherit' });
  } else {
    console.log('Обновляю ветки...');
    try {
      git(['fetch', '--all', '--quiet', '--prune']);
    } catch {
      console.warn('Не удалось обновить репозиторий, использую локальную копию.');
    }
  }
}

function getBranches() {
  return git(['branch', '-r', '--format=%(refname:short)'])
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^origin\/\d{3}$/.test(line))
    .map((line) => line.replace('origin/', ''))
    .sort();
}

function lessonBase(branch) {
  const log = git(['log', '--format=%H%x09%s', `origin/${branch}`]).split('\n');
  const run = [];
  for (const line of log) {
    if (!line.trim()) continue;
    const [hash, subject = ''] = line.split('\t');
    if (subject.trim() !== branch) break;
    run.push(hash);
  }
  if (!run.length) return null;
  try {
    return git(['rev-parse', `${run[run.length - 1]}^`]).trim();
  } catch {
    return null;
  }
}

function isBinary(text) {
  return text.includes('\u0000');
}

const TRIVIAL = [
  /^$/,
  /^[{}()[\];,]+$/,
  /^<\?php$/i,
  /^\?>$/,
  /^use\s/,
  /^namespace\s/,
  /^declare\s*\(/,
  /^\/\//,
  /^#/,
  /^\/\*/,
  /^\*/,
  /^--/,
  /^return\s*\[?\s*;?$/,
];

function meaningful(line, ext = '') {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (ext === '.sql') {
    if (!/^(CREATE TABLE|ALTER TABLE|ADD (PRIMARY|UNIQUE|KEY|CONSTRAINT)|`\w+`\s|INSERT INTO|DROP TABLE)/i.test(trimmed)) {
      return false;
    }
  }
  return !TRIVIAL.some((re) => re.test(trimmed));
}

function fileMentionedInDoc(num, file, docText) {
  if (!docText) return false;
  const normalized = file.replace(/\\/g, '/').toLowerCase();
  const base = normalized.split('/').pop();
  const variants = [normalized, normalized.replace(/^\.\//, '')];
  const haystack = docText.replace(/\\/g, '/').toLowerCase();
  return variants.some((v) => haystack.includes(v)) || (base.length > 5 && haystack.includes(base));
}

function readDocText(num) {
  const file = path.join(ROOT, 'public', 'doc', `${num}.docx`);
  if (!fs.existsSync(file)) return '';
  try {
    const zip = new AdmZip(file);
    const xml = zip.readAsText('word/document.xml');
    return xml
      .replace(/<w:tab[^>]*\/>/g, ' ')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  } catch {
    return '';
  }
}

function parseDiff(base, ref, file) {
  const diff = git(['diff', '--unified=0', base, ref, '--', file]);
  const added = [];
  const removed = [];
  for (const raw of diff.split('\n')) {
    if (raw.startsWith('+++') || raw.startsWith('---')) continue;
    if (raw.startsWith('+')) added.push(raw.slice(1));
    else if (raw.startsWith('-')) removed.push(raw.slice(1));
  }
  return { added, removed };
}

function buildTask({ branch, base, file, lesson, docText }) {
  let before;
  let after;
  try {
    before = git(['show', `${base}:${file}`]);
    after = git(['show', `origin/${branch}:${file}`]);
  } catch {
    return null;
  }
  if (isBinary(before) || isBinary(after)) return null;
  if (before.split('\n').length > 360 || after.split('\n').length > 360) return null;

  const { added, removed } = parseDiff(base, `origin/${branch}`, file);
  const ext = path.extname(file).toLowerCase();
  const beforeNorm = new Set(before.split('\n').map(normalizeLine).filter(Boolean));
  const afterNorm = new Set(after.split('\n').map(normalizeLine).filter(Boolean));

  const required = [];
  const requiredSeen = new Set();
  for (const line of added) {
    if (!meaningful(line, ext)) continue;
    const key = normalizeLine(line);
    if (!key || beforeNorm.has(key) || requiredSeen.has(key)) continue;
    requiredSeen.add(key);
    required.push(line.trim());
  }

  const forbidden = [];
  const forbiddenSeen = new Set();
  for (const line of removed) {
    if (!meaningful(line, ext)) continue;
    const key = normalizeLine(line);
    if (!key || afterNorm.has(key) || forbiddenSeen.has(key) || requiredSeen.has(key)) continue;
    forbiddenSeen.add(key);
    forbidden.push(line.trim());
  }

  if (!required.length && !forbidden.length) return null;
  if (ext === '.sql' && required.length > 6) return null;
  if (required.length > 10 || forbidden.length > 10) return null;
  if (required.length + forbidden.length > 16) return null;

  const lang = { '.php': 'php', '.js': 'js', '.css': 'css', '.sql': 'sql' }[ext];

  return {
    id: `${branch}-${file.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')}`,
    lesson: branch,
    title: lesson?.title || branch,
    file,
    lang,
    before,
    after,
    required,
    forbidden,
    doc: `doc/${branch}.docx`,
    mention: fileMentionedInDoc(branch, file, docText),
    size: required.length + forbidden.length,
  };
}

function main() {
  ensureRepo();
  const branches = getBranches();
  const lessonsByNum = new Map(LESSONS.map((lesson) => [lesson.num, lesson]));
  const docCache = new Map();
  const tasks = [];
  const seen = new Set();
  const ids = new Set();

  for (const branch of branches) {
    const base = lessonBase(branch);
    if (!base) {
      console.log(`${branch}: нет коммитов урока, пропуск`);
      continue;
    }

    if (!docCache.has(branch)) docCache.set(branch, readDocText(branch));
    const docText = docCache.get(branch);

    let files;
    try {
      files = git(['diff', '--name-status', base, `origin/${branch}`])
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [status, ...rest] = line.split('\t');
          return { status: status[0], file: rest.join('\t') };
        });
    } catch (error) {
      console.warn(`${branch}: diff не удался — ${error.message}`);
      continue;
    }

    const candidates = [];
    for (const { status, file } of files) {
      if (status !== 'M') continue;
      if (file.includes('"')) continue;
      const ext = path.extname(file).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) continue;
      if (SKIP_PATH.some((re) => re.test(file))) continue;
      const task = buildTask({
        branch,
        base,
        file,
        lesson: lessonsByNum.get(branch),
        docText,
      });
      if (task) candidates.push(task);
    }

    candidates.sort((a, b) => {
      if (a.mention !== b.mention) return a.mention ? -1 : 1;
      return a.size - b.size;
    });

    let added = 0;
    for (const task of candidates) {
      const fingerprint = `${task.file}\n${task.required.join('\n')}\n${task.forbidden.join('\n')}`;
      if (seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      let id = task.id;
      let suffix = 2;
      while (ids.has(id)) {
        id = `${task.id}-${suffix}`;
        suffix += 1;
      }
      ids.add(id);
      task.id = id;
      delete task.mention;
      delete task.size;
      tasks.push(task);
      added += 1;
      if (added >= 3) break;
    }

    console.log(`${branch}: ${added} билет(ов), файлов ${files.length}`);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: REPO_URL,
    tasks,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload), 'utf8');
  console.log(`\nГотово: ${tasks.length} билетов, ${(fs.statSync(OUT).size / 1024).toFixed(0)} КБ`);
  console.log(OUT);
}

main();
