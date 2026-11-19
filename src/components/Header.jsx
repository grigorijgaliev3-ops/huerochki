import { asset } from '../lib/media.js';

export default function Header({ authed, onLogout }) {
  return (
    <header className="header">
      <div className="wrap header__inner">
        <a className="brand" href="#top" aria-label="huerochki">
          <img className="brand__mark" src={asset('logo.svg')} alt="" width="26" height="26" />
          <span>huerochki</span>
        </a>

        <div className="header__right">
          <span className="tag">ИР-23-4</span>
          {authed && (
            <button type="button" className="ghost" id="logout" onClick={onLogout}>
              Выйти
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
