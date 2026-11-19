import { asset } from '../lib/media.js';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__inner">
        <img className="brand__mark" src={asset('logo.svg')} alt="" width="20" height="20" />
        <span>Grably Mikhail Vladi &amp; Grigo</span>
      </div>
    </footer>
  );
}
