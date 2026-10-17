# FSB Racing Team - Recruitment Task

A Payload CMS project built with Next.js and SQLite.

The homepage is managed through Payload and supports editable Hero Block, Hero Video, and Image Gallery blocks. 3D View will be added in a later step.

## Requirements

- Node.js 24 LTS
- npm 11

The development environment uses Node.js 24.13.0 and npm 11.6.2. SQLite does not require a separate database server.

## Getting started

Install the dependencies and create a local environment file:

```bash
npm ci
cp .env.example .env
```

Generate a secret:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Set `PAYLOAD_SECRET` in `.env` to the generated value. Keep `DATABASE_URL=file:./payload.db` for local development.

Start the development server:

```bash
npm run dev
```

- Homepage: http://localhost:3000
- Admin panel: http://localhost:3000/admin

On your first visit to the admin panel, create an administrator account. There are no default credentials.

If the dependencies and `.env` are already set up, only `npm run dev` is needed. If your terminal cannot find `node` or `npm`, add Node.js to PATH or use the Node.js interpreter configured in WebStorm.

## Editing the homepage

1. Open `/admin` and sign in.
2. Open **Homepage** and add a **Hero Block** under **Page blocks**.
3. Enter a title and, optionally, a description and image. Images can be selected from Media or uploaded from the image field. Add meaningful alt text when uploading an image.
4. To show a button, fill in both **Button Label** and **Button Link**. Links can be local paths such as `/team`, anchors such as `#main-content`, or full HTTP(S) URLs. A local path must point to a page that exists; `/team` is only an example.
5. Save and refresh the public homepage to see the changes.

Blocks can be reordered or removed. An empty homepage displays a short placeholder. Only signed-in users can edit the homepage; visitors can read it without signing in. Homepage content is rendered on each request, so content changes do not require a new build.

## Hero Video

In **Homepage**, add a **Hero Video** block and enter a title. Upload or select an MP4 or WebM file in **Video**. The Media description field should describe the video. You can also add a description and select an optional **Poster image**.

- **Autoplay (muted)** starts the video without sound. It is off by default and respects the visitor's reduced-motion setting. Browser policies can also prevent autoplay; manual controls remain available.
- **Loop video** repeats playback when the video ends. It is off by default.
- Native controls provide play/pause, seeking, sound controls when the video has audio, and fullscreen where supported. Videos play inline on mobile devices.

Save the homepage and refresh the public page. MP4 files should use a browser-compatible codec such as H.264; a file extension alone does not guarantee playback support. Unsupported or unavailable videos display an error and a download link.

For a quick upload test, use `tests/fixtures/hero-video.webm`. It is an original two-second synthetic test clip without audio, not racing footage. It is included in the repository so tests do not require FFmpeg or external downloads.

## Image Gallery

In **Homepage**, add an **Image Gallery** block and enter a title and optional description. Under **Images**, add one row per image and select or upload an image from Media. Add meaningful alt text to the uploaded file. Each row can have an optional caption and multiple **Tags**, such as Workshop, Testing, and Competition. Reorder rows to change the display order.

Save and refresh the public homepage. Filter buttons appear automatically from the tags used in that gallery. **All** includes every image, including images without tags. An image with multiple tags appears under each matching filter. Tag matching ignores capitalization and surrounding spaces. Filtering stays within each gallery and does not reload the page. Without JavaScript, all images remain visible.

The grid uses three columns on desktop, two on smaller screens, and one on phones. Images are cropped to a 4:3 preview; captions appear underneath. Only image files can be selected in this block.

## Environment variables

| Variable         | Description                                                                         |
| ---------------- | ----------------------------------------------------------------------------------- |
| `DATABASE_URL`   | SQLite database path. Defaults to `file:./payload.db` in the example configuration. |
| `PAYLOAD_SECRET` | A random secret used for authentication. Keep it private.                           |

Payload creates the database during the first development startup. Uploaded files are stored in `media/`. The database, uploads, `.env`, installed dependencies, and build output are excluded from Git.

## Commands

```bash
npm run dev               # Start the development server
npm run typecheck         # Check TypeScript types
npm run lint              # Run ESLint
npm test                  # Run isolated homepage block tests
npm run build             # Create a production build
npm run start             # Start an existing production build
npm run generate:types    # Regenerate types after changing the CMS schema
```

Development startup, authentication, type checking, linting, and homepage block integration tests have been verified. Hero Video playback, muted autoplay, reduced-motion behavior, loop settings, and mobile layout were also checked in Chrome. Gallery filters, multiple galleries, image loading, mobile layout, and the no-JavaScript fallback were checked in Chrome as well. The production build has not yet been fully verified because previous attempts were interrupted by IDE crashes. Production database migrations and Docker setup will be added in a later step.

## Tests

`npm test` checks public read access, authenticated editing, image upload relationships, required fields, button link validation, an empty homepage, and Hero Video upload relationships and playback settings. It also checks that an image cannot be selected as a video or a video as a poster. Gallery tests cover ordered images, captions, multiple tags, filtering, untagged images, duplicate tag normalization, missing images, and rejection of video files. Tests use a separate temporary SQLite database and upload directory, which are removed after the test run. Existing accounts and content are not used by these tests.

The test runner uses one process and exits after the tests finish because the development schema tooling starts background services.

## Dependencies

Payload and its SQLite, admin UI, and rich text packages use version **3.91.0**. Next.js is **16.4.2**, React and React DOM are **19.2.6**, and sharp is **0.35.5**.

See `package.json` for direct dependencies and `package-lock.json` for the complete locked dependency tree. Use `npm ci` to install the locked versions.

The project started from the official Payload starter generated with `create-payload-app@3.91.0`. Next.js and sharp were updated to patched versions. Sass and DOMPurify overrides are listed in `package.json`.
