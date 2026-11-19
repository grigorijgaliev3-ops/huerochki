import { asset } from '../lib/media.js';

const MATERIALS = [
  {
    title: 'Каркас Yii',
    name: 'yii-basic + imagine + janisto + kartik',
    href: 'materials/yii-basic-2.0.53-imagine-2.3.1-janisto-1.1.0-kartik-3.5.3.zip',
  },
  { title: 'Задание', name: 'task.zip', href: 'materials/task.zip' },
  { title: 'Слайдер', name: 'sport.zip', href: 'materials/sport.zip' },
  { title: 'Шрифты', name: 'GoogleFonts.zip', href: 'materials/GoogleFonts.zip' },
];

export default function Materials() {
  return (
    <section className="block" id="materials">
      <h2 className="block__title">Материалы</h2>

      <div className="pills">
        {MATERIALS.map((item) => (
          <a
            key={item.href}
            className="pill"
            href={asset(item.href)}
            download
            title={`${item.title} · ${item.name}`}
          >
            <span className="pill__title">{item.title}</span>
            <span className="pill__name">{item.name}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
