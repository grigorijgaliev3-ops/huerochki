import { useEffect, useMemo, useRef, useState } from 'react';
import { asset } from '../lib/media.js';
import { normalize } from '../lib/storage.js';

const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'video', label: 'С видео' },
  { id: 'done', label: 'Пройдено' },
];

function LessonRow({ lesson, isDone, onToggleDone, onPlay }) {
  return (
    <article className={`lesson${isDone ? ' is-done' : ''}`} data-num={lesson.num}>
      <span className="lesson__num">{lesson.num}</span>
      <h3 className="lesson__title">{lesson.title}</h3>

      <div className="lesson__actions">
        <a
          className="act act--word"
          href={asset(`doc/${lesson.num}.docx`)}
          target="_blank"
          rel="noopener"
          title="Открыть методичку"
        >
          Word
        </a>

        {lesson.videos.map((video) => (
          <button
            key={video.file}
            type="button"
            className="act act--video"
            title={`Смотреть: ${video.label}`}
            onClick={() => onPlay({
              num: lesson.num,
              title: lesson.title,
              file: video.file,
              label: video.label,
            })}
          >
            <span className="act__play" aria-hidden="true" />
            {video.label}
          </button>
        ))}

        <button
          type="button"
          className="check"
          aria-pressed={isDone}
          aria-label={`${isDone ? 'Снять отметку с темы' : 'Отметить тему'} ${lesson.num}`}
          title="Отметить как пройденное"
          onClick={() => onToggleDone(lesson.num)}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12.5 4.5 4.5L19 7" />
          </svg>
        </button>
      </div>
    </article>
  );
}

export default function Lessons({ lessons, done, onToggleDone, onResetDone, onPlay }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const searchRef = useRef(null);
  const normalizedQuery = normalize(query);

  const visible = useMemo(() => {
    const parts = normalizedQuery ? normalizedQuery.split(/\s+/) : [];

    return lessons.filter((lesson) => {
      if (filter === 'video' && lesson.videos.length === 0) return false;
      if (filter === 'done' && !done.has(lesson.num)) return false;
      if (!parts.length) return true;
      const haystack = normalize(`${lesson.num} ${lesson.title}`);
      return parts.every((part) => haystack.includes(part));
    });
  }, [lessons, filter, done, normalizedQuery]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      const active = document.activeElement;
      const typing = active && (
        active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable
      );
      if (typing) return;
      if (document.body.classList.contains('locked')) return;
      if (document.body.classList.contains('modal-open')) return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function resetFilters() {
    setQuery('');
    setFilter('all');
  }

  function resetProgress() {
    if (!done.size) return;
    if (window.confirm('Сбросить все отметки?')) onResetDone();
  }

  return (
    <section className="block" id="lessons">
      <div className="block__head">
        <h2 className="block__title">
          Темы <span className="block__count">{done.size}/{lessons.length}</span>
        </h2>
        <button type="button" className="ghost ghost--xs" onClick={resetProgress} title="Сбросить прогресс">
          сбросить
        </button>
      </div>

      <div className="toolbar">
        <input
          ref={searchRef}
          type="search"
          id="search"
          className="search"
          placeholder="Поиск по темам"
          aria-label="Поиск по темам"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="filters" role="group" aria-label="Фильтр тем">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip${filter === item.id ? ' is-active' : ''}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="lessons">
        {visible.map((lesson) => (
          <LessonRow
            key={lesson.num}
            lesson={lesson}
            isDone={done.has(lesson.num)}
            onToggleDone={onToggleDone}
            onPlay={onPlay}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <div className="empty">
          <p>Ничего не нашлось.</p>
          <button type="button" className="ghost" onClick={resetFilters}>
            Сбросить
          </button>
        </div>
      )}
    </section>
  );
}
