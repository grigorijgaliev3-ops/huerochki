import { useEffect, useRef, useState } from 'react';
import { asset } from '../lib/media.js';
import { checkCredentials } from '../lib/storage.js';

export default function Gate({ onSuccess }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const loginRef = useRef(null);

  useEffect(() => {
    loginRef.current?.focus();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    if (checkCredentials(login, password)) {
      setError('');
      onSuccess();
      return;
    }
    setError('Неверный логин или пароль');
    setAttempt((value) => value + 1);
  }

  return (
    <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <form className="gate__card" id="gate-form" onSubmit={handleSubmit} noValidate>
        <div className="gate__brand">
          <img src={asset('logo.svg')} alt="" width="32" height="32" />
          <span>huerochki</span>
        </div>

        <h1 className="gate__title" id="gate-title">Вход</h1>

        <label className="field">
          <span>Логин</span>
          <input
            ref={loginRef}
            type="text"
            id="login"
            name="login"
            autoComplete="username"
            placeholder="ir-23-4"
            spellCheck="false"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Пароль</span>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="•••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error && (
          <p className="gate__error is-shake" id="gate-error" role="alert" key={attempt}>
            {error}
          </p>
        )}

        <button type="submit" className="btn btn--primary">
          Войти
        </button>

        <p className="gate__hint"><b>ir-23-4</b> / <b>ir-23-4</b></p>
      </form>
    </div>
  );
}
