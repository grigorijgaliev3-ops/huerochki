import { useEffect, useRef } from 'react';
import { basicSetup, EditorView } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { php } from '@codemirror/lang-php';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';

const LANGUAGES = {
  php: () => php(),
  js: () => javascript(),
  css: () => css(),
  sql: () => sql(),
};

const theme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#0f1116',
      color: '#e7e9ee',
      fontSize: '13px',
    },
    '.cm-content': {
      fontFamily: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
      padding: '12px 0',
      caretColor: '#7c8cff',
    },
    '.cm-scroller': {
      maxHeight: '52vh',
      lineHeight: '1.55',
    },
    '.cm-gutters': {
      backgroundColor: '#0f1116',
      color: '#4c5261',
      border: 'none',
      paddingRight: '6px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(124, 140, 255, .06)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(124, 140, 255, .06)',
      color: '#8b93a3',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
      backgroundColor: 'rgba(124, 140, 255, .28) !important',
    },
    '.cm-cursor': {
      borderLeftColor: '#7c8cff',
    },
    '.cm-tooltip': {
      backgroundColor: '#181b22',
      border: '1px solid #23272f',
    },
  },
  { dark: true },
);

export default function CodeEditor({ value, language = 'php', onChange }) {
  const hostRef = useRef(null);
  const viewRef = useRef(null);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const languageExt = LANGUAGES[language]?.() ?? [];
    const view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          oneDark,
          theme,
          languageExt,
          keymap.of([indentWithTab]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) changeRef.current?.(update.state.doc.toString());
          }),
        ],
      }),
    });

    viewRef.current = view;
    host.__cmView = view;
    return () => {
      view.destroy();
      viewRef.current = null;
      delete host.__cmView;
    };
    // Редактор создаётся заново при смене билета (key в родителе).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  return <div className="code-editor" ref={hostRef} />;
}
