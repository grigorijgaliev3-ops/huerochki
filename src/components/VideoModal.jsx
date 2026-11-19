import { useEffect, useRef } from 'react';
import { asset } from '../lib/media.js';

export default function VideoModal({ video, onClose }) {
  const playerRef = useRef(null);
  const closeRef = useRef(null);
  const src = asset(`video/${video.file}`);

  useEffect(() => {
    closeRef.current?.focus();
    const player = playerRef.current;
    if (!player) return;
    const playPromise = player.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  }, []);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="video-title">
      <div className="modal__backdrop" onClick={onClose} />

      <div className="modal__window">
        <div className="modal__head">
          <h3 className="modal__title" id="video-title">
            <span className="modal__num">{video.num}</span>
            {video.title}
          </h3>
          <button ref={closeRef} type="button" className="modal__close" aria-label="Закрыть" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <video ref={playerRef} className="modal__video" src={src} controls playsInline preload="metadata" />

        <div className="modal__foot">
          <span className="modal__label">{video.label}</span>
          <a className="ghost" href={src} download={video.file}>
            Скачать
          </a>
        </div>
      </div>
    </div>
  );
}
