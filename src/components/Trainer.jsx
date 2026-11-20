import { useEffect, useMemo, useState } from 'react';
import trainerData from '../data/trainer.json';
import CodeEditor from './CodeEditor.jsx';
import { asset } from '../lib/media.js';
import {
  checkTask,
  diffLines,
  loadStats,
  maskLine,
  pickTask,
  saveStats,
  taskPrompt,
} from '../lib/trainer.js';

const TASKS = trainerData.tasks;

const LANG_LABELS = { php: 'PHP', js: 'JS', css: 'CSS', sql: 'SQL' };

function ResultPanel({ task, result, code }) {
  const rows = useMemo(() => {
    if (!result || result.passed) return [];
    return diffLines(code, task.after);
  }, [result, code, task.after]);

  if (!result) return null;

  return (
    <div className={`trainer-result${result.passed ? ' is-ok' : ''}`}>
      <div className="trainer-result__head">
        <span className="trainer-result__title">
          {result.passed ? 'Верно' : `Совпало на ${result.score}%`}
        </span>
        {!result.passed && (
          <span className="trainer-result__hint">
            {result.missing > 0 && `не хватает строк: ${result.missing}`}
            {result.missing > 0 && result.extra > 0 && ' · '}
            {result.extra > 0 && `лишних строк: ${result.extra}`}
          </span>
        )}
      </div>

      <ul className="checks">
        {result.required.map((row, index) => (
          <li key={`r-${index}`} className={row.ok ? 'is-ok' : 'is-bad'}>
            <span className="checks__mark">{row.ok ? '+' : '−'}</span>
            <code>{row.text}</code>
          </li>
        ))}
        {result.forbidden.map((row, index) => (
          <li key={`f-${index}`} className={row.ok ? 'is-ok' : 'is-bad'}>
            <span className="checks__mark">{row.ok ? '−' : '+'}</span>
            <code>{row.text}</code>
          </li>
        ))}
      </ul>

      {rows.length > 0 && (
        <details className="trainer-diff">
          <summary>Показать различия с эталоном</summary>
          <pre>
            {rows.map((row, index) => (
              <span key={index} className={`diff-line diff-line--${row.type}`}>
                {row.type === 'add' ? '+ ' : row.type === 'del' ? '− ' : '  '}
                {row.text}
                {'\n'}
              </span>
            ))}
          </pre>
        </details>
      )}
    </div>
  );
}

export default function Trainer({ done }) {
  const [stats, setStats] = useState(loadStats);
  const [pool, setPool] = useState(() => (done.size >= 3 ? 'done' : 'all'));
  const [task, setTask] = useState(() => pickTask(TASKS, {
    done,
    pool: done.size >= 3 ? 'done' : 'all',
    recent: [],
    solved: loadStats().solved,
  }));
  const [code, setCode] = useState(task?.before ?? '');
  const [result, setResult] = useState(null);
  const [hint, setHint] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const doneTasks = useMemo(
    () => TASKS.filter((item) => done.has(item.lesson)),
    [done],
  );
  const solvedCount = useMemo(
    () => TASKS.filter((item) => stats.solved[item.id]).length,
    [stats.solved],
  );

  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  function openTask(next) {
    if (!next) return;
    setTask(next);
    setCode(next.before);
    setResult(null);
    setHint(false);
    setRevealed(false);
  }

  function nextTask() {
    const recent = [...stats.recent, task?.id].filter(Boolean).slice(-8);
    openTask(pickTask(TASKS, { done, pool, recent, solved: stats.solved }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function changePool(value) {
    setPool(value);
    const recent = [...stats.recent, task?.id].filter(Boolean).slice(-8);
    openTask(pickTask(TASKS, { done, pool: value, recent, solved: stats.solved }));
  }

  function check() {
    if (!task) return;
    const checked = checkTask(task, code);
    setResult(checked);
    setStats((prev) => ({
      ...prev,
      attempts: prev.attempts + 1,
      streak: checked.passed ? prev.streak + 1 : 0,
      best: checked.passed ? Math.max(prev.best, prev.streak + 1) : prev.best,
      solved: checked.passed ? { ...prev.solved, [task.id]: true } : prev.solved,
      recent: [...prev.recent, task.id].slice(-8),
    }));
  }

  function reveal() {
    setRevealed((value) => !value);
    if (!revealed && task) {
      setStats((prev) => ({
        ...prev,
        viewed: { ...prev.viewed, [task.id]: true },
      }));
    }
  }

  if (!task) {
    return (
      <section className="trainer">
        <p>Не удалось загрузить билеты.</p>
      </section>
    );
  }

  const language = LANG_LABELS[task.lang] || task.lang;

  return (
    <section className="trainer" id="trainer">
      <div className="trainer__head">
        <div>
          <p className="trainer__kicker">
            Билет {task.lesson} · {language}
            {stats.solved[task.id] && <span className="trainer__solved">решено</span>}
            {!stats.solved[task.id] && stats.viewed[task.id] && (
              <span className="trainer__seen">подсмотрел</span>
            )}
          </p>
          <h2 className="trainer__title">{task.title}</h2>
          <p className="trainer__file">{task.file}</p>
        </div>

        <div className="trainer__stats">
          <span><b>{solvedCount}</b> / {TASKS.length} решено</span>
          <span>серия <b>{stats.streak}</b></span>
          <span>попыток <b>{stats.attempts}</b></span>
        </div>
      </div>

      <div className="trainer__bar">
        <div className="segmented" role="group" aria-label="Пул билетов">
          <button
            type="button"
            className={pool === 'done' ? 'is-active' : ''}
            onClick={() => changePool('done')}
          >
            Пройдено <span>{doneTasks.length}</span>
          </button>
          <button
            type="button"
            className={pool === 'all' ? 'is-active' : ''}
            onClick={() => changePool('all')}
          >
            Все <span>{TASKS.length}</span>
          </button>
        </div>

        <div className="trainer__bar-right">
          <a className="ghost" href={asset(task.doc)} target="_blank" rel="noopener">
            Методичка
          </a>
          <button type="button" className="ghost" onClick={nextTask}>
            Новый билет
          </button>
        </div>
      </div>

      {pool === 'done' && doneTasks.length === 0 && (
        <p className="trainer__note">
          Пройденных тем пока нет — показываю все билеты. Отмечай темы галочкой, и они появятся здесь.
        </p>
      )}

      <p className="trainer__task">
        {taskPrompt(task)}
        <span className="trainer__task-sub"> Отредактируй файл и нажми «Проверить».</span>
      </p>

      <CodeEditor key={task.id} value={code} language={task.lang} onChange={setCode} />

      <div className="trainer__actions">
        <button type="button" className="btn btn--primary" onClick={check}>
          Проверить
        </button>
        <button type="button" className="ghost" onClick={() => setHint((value) => !value)}>
          {hint ? 'Скрыть подсказку' : 'Подсказка'}
        </button>
        <button type="button" className="ghost" onClick={reveal}>
          {revealed ? 'Скрыть ответ' : 'Показать ответ'}
        </button>
        {result?.passed && (
          <button type="button" className="ghost ghost--accent" onClick={nextTask}>
            Следующий билет →
          </button>
        )}
      </div>

      {hint && (
        <div className="trainer-hint">
          <span className="trainer-hint__label">Подсказка</span>
          <ul>
            {task.required.slice(0, 4).map((line, index) => (
              <li key={index}><code>{maskLine(line)}</code></li>
            ))}
            {task.required.length > 4 && <li>…и ещё {task.required.length - 4}</li>}
          </ul>
          {task.forbidden.length > 0 && (
            <p>Старые строки нужно убрать или заменить.</p>
          )}
        </div>
      )}

      {revealed && (
        <div className="trainer-answer">
          <span className="trainer-hint__label">Эталон</span>
          <pre>{task.after}</pre>
        </div>
      )}

      <ResultPanel task={task} result={result} code={code} />
    </section>
  );
}
