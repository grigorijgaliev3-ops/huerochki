import { useCallback, useEffect, useState } from 'react';
import lessons from './data/lessons.json';
import Gate from './components/Gate.jsx';
import Header from './components/Header.jsx';
import Materials from './components/Materials.jsx';
import Lessons from './components/Lessons.jsx';
import Footer from './components/Footer.jsx';
import VideoModal from './components/VideoModal.jsx';
import { readAuth, readDone, writeAuth, writeDone } from './lib/storage.js';

export default function App() {
  const [authed, setAuthed] = useState(readAuth);
  const [done, setDone] = useState(() => readDone(lessons));
  const [video, setVideo] = useState(null);

  useEffect(() => {
    document.body.classList.toggle('locked', !authed);
    document.body.classList.toggle('modal-open', Boolean(video));
  }, [authed, video]);

  useEffect(() => {
    if (!video) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setVideo(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [video]);

  const toggleDone = useCallback((num) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      writeDone(next);
      return next;
    });
  }, []);

  const resetDone = useCallback(() => {
    const empty = new Set();
    writeDone(empty);
    setDone(empty);
  }, []);

  const handleLogin = useCallback(() => {
    writeAuth(true);
    setAuthed(true);
  }, []);

  const handleLogout = useCallback(() => {
    writeAuth(false);
    setAuthed(false);
    setVideo(null);
  }, []);

  return (
    <>
      {!authed && <Gate onSuccess={handleLogin} />}

      <Header authed={authed} onLogout={handleLogout} />

      <main className="wrap main">
        <Materials />
        <Lessons
          lessons={lessons}
          done={done}
          onToggleDone={toggleDone}
          onResetDone={resetDone}
          onPlay={setVideo}
        />
      </main>

      <Footer />

      {video && <VideoModal video={video} onClose={() => setVideo(null)} />}
    </>
  );
}
