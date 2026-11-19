# huerochki

Темы демоэкзамена 09.02.07: 78 методичек, 76 видео, 4 архива. React + Vite, тёмная тема, прогресс в браузере.

## Запуск

```bash
npm install
npm run dev
```

`http://localhost:5173` · логин `ir-23-4` · пароль `ir-23-4` (или `ir` / `23-4`).

## Сборка

```bash
npm run build
```

`dist/index.html` открывается даже с диска: JS и CSS вшиты через `vite-plugin-singlefile`, медиа лежат рядом в `dist/doc`, `dist/video`, `dist/materials`.

Без `zeal.zip` сборка весит ~696 МБ, самый большой файл — видео ~44 МБ. Это проходит лимиты GitHub Pages: сайт ≤ 1 ГБ, файл ≤ 100 МБ.

## Хостинг на GitHub Pages

Нужен аккаунт GitHub и установленный Git. Репозиторий — **public** (иначе Pages на бесплатном плане не включится).

### 1. Создать репозиторий

На GitHub: **New repository** → имя `huerochki` → Public → **без** README и .gitignore → Create.

### 2. Запушить исходники

В папке проекта:

```bash
git init
git branch -M main
git add .
git commit -m "huerochki"
git remote add origin https://github.com/ТВОЙ_НИК/huerochki.git
git push -u origin main
```

В репозиторий не попадут `node_modules`, `dist` и тяжёлые папки `public/doc|video|materials` — они перечислены в `.gitignore`, чтобы не заливать 696 МБ в основную ветку. Готовый сайт уедет отдельно, в ветку `gh-pages`.

### 3. Задеплоить

```bash
npm run deploy
```

Команда собирает `dist/` и пушит его содержимое в ветку `gh-pages` (пакет `gh-pages` уже установлен; при первом запуске Git спросит логин/токен).

Первый деплой долгий — заливается ~661 МБ. Дальше быстрее, но всё равно много: gh-pages каждый раз пушит медиа заново.

### 4. Включить Pages

На GitHub: **Settings → Pages → Build and deployment**

- Source: **Deploy from a branch**
- Branch: **gh-pages** / **/(root)**
- Save

Через минуту сайт будет тут:

```
https://ТВОЙ_НИК.github.io/huerochki/
```

### Обновить сайт

```bash
npm run deploy
```

Pages обновится сам после пуша в `gh-pages`.

### Если не хочешь каждый раз пушить 661 МБ

Можно вынести медиа на Cloudflare R2 (10 ГБ бесплатно, трафик бесплатный) и держать в Git только код. Тогда понадобится `VITE_MEDIA_BASE` в `src/lib/media.js` и заливка `public/` в бакет. Для текущего варианта это не требуется.

## Структура

```
src/
├─ App.jsx              — вход, прогресс, модалка
├─ components/          — Gate, Header, Materials, Lessons, VideoModal, Footer
├─ lib/
│  ├─ media.js          — пути к public/
│  └─ storage.js        — вход, прогресс, проверка пароля
├─ data/lessons.json    — 78 тем
└─ styles.css
public/
├─ doc/                 — 78 .docx
├─ video/               — 76 .mp4
├─ materials/           — 4 архива
├─ logo.svg
└─ .nojekyll            — чтобы Pages не трогал файлы через Jekyll
```

## Что умеет

- Вход с запоминанием в `localStorage`, выход.
- Поиск по номеру/названию, фильтры «Все / С видео / Пройдено».
- Отметки о прохождении, счётчик и сброс.
- Word открывается в новой вкладке, видео — в модалке.
- `/` — фокус в поиск, `Esc` — закрыть видео.
- Адаптив под телефон.

Пароль проверяется в браузере, это символическая защита, а не безопасность.

## Авторы

Grably Mikhail Vladi & Grigo · 2026
