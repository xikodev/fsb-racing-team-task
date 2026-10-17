# FSB Racing Team - Recruitment Task

A Payload CMS project built with Next.js and SQLite.

The homepage is managed through Payload and supports four editable blocks: Hero Block, Hero Video, 3D View, and Image Gallery.

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

## Production without Docker

For the first deployment of your existing local content, stop editing in the admin panel and export a production copy:

```bash
npm run production:export
npm run build
DATA_DIR=./data DATABASE_URL=file:./data/payload.db npm run start
```

The export creates `data/payload.db`, `data/media/`, and `data/models/`. It uses SQLite's backup API, verifies the copied schema against a freshly migrated database, and records the initial migration on the copy. Your development database and uploads stay unchanged. Existing administrator accounts and content are preserved. Keep the same `PAYLOAD_SECRET` from `.env`.

The destination must not already exist. For another snapshot, choose a different directory with `npm run production:export -- path/to/new-directory`. This command is only for the initial development-to-production transition, not for upgrading an existing production database.

For an empty production installation, skip the export, then build and start with the same `DATA_DIR` and `DATABASE_URL` shown above. The start script creates the data directory; migrations prepare the schema on the first request. Create an administrator through `/admin`.

The build uses Next.js standalone output, one build worker, and a 1536 MB JavaScript heap limit. `npm run start` copies the static assets into the standalone directory and starts its server. Use `PORT=3001` if port 3000 is occupied. Stop with Ctrl+C.

Committed migrations live in `src/migrations/` and run automatically when Payload initializes in production. After future CMS schema changes, run `npm run migrate:create -- describe-the-change`, review the generated migration, and rebuild. Back up production data before applying schema changes. Keep `npm run dev` pointed at the development database.

## Docker

Requires Docker Engine and the Docker Compose plugin. Make sure `.env` contains a strong `PAYLOAD_SECRET`, then run:

```bash
docker compose up --build -d
docker compose ps
```

Open http://localhost:3000 and http://localhost:3000/admin. Stop the development server first if it is using port 3000. The default Compose configuration binds to localhost, ready for a reverse proxy such as Nginx.

The container runs Node.js 24.13.0 as the unprivileged `node` user. Its named volume, `app-data`, stores the SQLite database and both upload directories under `/app/data`. The Docker image excludes `.env`, databases, local uploads, and IDE files. The secret is provided at runtime; a new installation starts without local content or accounts. `/api/health` verifies that the app and database are ready.

To transfer your current content **before the first container startup**, use an empty Docker volume and run:

```bash
npm run production:export
docker compose create --build
docker compose cp data/. app:/app/data
docker compose run --rm --no-deps --user root --entrypoint chown app -R node:node /app/data
docker compose up -d
```

If `data/` already contains the export you want, skip the first command. The one-time ownership command makes the copied files writable by the unprivileged application user. Do not copy over an existing production installation; back it up first.

```bash
docker compose logs -f app        # View logs
docker compose restart app        # Restart without losing content
docker compose down              # Stop and remove containers, keeping the volume
```

Do not use `docker compose down -v` unless you intend to delete the database and uploads. For a consistent backup, stop the app and copy the entire `/app/data` directory before starting it again. Rebuilding the image does not replace the named volume. Run one application instance with this local SQLite setup.

The same Dockerfile can also be built and run with Podman:

```bash
podman build --format docker -t fsb-racing-team .
podman run -d --name fsb-racing-team \
  -p 127.0.0.1:3000:3000 --env-file .env \
  -e DATABASE_URL=file:/app/data/payload.db -e DATA_DIR=/app/data \
  -v fsb-racing-data:/app/data fsb-racing-team
```

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

## 3D View

In **Homepage**, add a **3D View** block, enter a title and optional description, then upload or select a file in **Model**. Models are stored in a separate **3D Models** collection. Fill in **Model description** with meaningful alt text.

**Supported format: GLB (.glb), version 2.0.** Export with textures embedded in the file. GLTF and FBX uploads are not supported. The upload checks the extension and GLB header; actual model decoding happens in the browser, which displays an error if the model cannot be rendered.

- **Automatic rotation** is off by default.
- **Rotation speed** accepts 1–180 degrees per second; the default is 20.
- Visitors can drag or use arrow keys to rotate and scroll or pinch to zoom.
- Automatic rotation respects reduced-motion preferences. A pause/resume button is available when rotation is enabled.
- The GLB download link also works without JavaScript. Interactive rendering requires JavaScript and a browser with WebGL support.

For a quick upload test, use `tests/fixtures/cube.glb`. It is an original, untextured red cube included with the project, not a model of the team's car. No external model download is required.

The viewer uses [`@google/model-viewer`](https://modelviewer.dev/) **4.2.0**, loaded on the client from the installed package. For the simplest local test, use an uncompressed GLB with embedded resources. Compressed models may require the viewer's external decoder resources and a network connection.

## Environment variables

| Variable         | Description                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | SQLite database path. Defaults to `file:./payload.db` in the example configuration.                         |
| `PAYLOAD_SECRET` | A random secret used for authentication. Keep it private.                                                   |
| `DATA_DIR`       | Parent directory for uploads. Local development defaults to the project directory; Docker uses `/app/data`. |
| `PORT`           | Server port; defaults to 3000.                                                                              |

Payload creates the database during the first development startup. Uploaded images and videos are stored in `media/`; GLB models are stored in `models/`. The database, uploads, `.env`, installed dependencies, and build output are excluded from Git.

## Commands

```bash
npm run dev               # Start the development server
npm run typecheck         # Check TypeScript types
npm run lint              # Run ESLint
npm test                  # Run isolated homepage block tests
npm run build             # Create a production build
npm run start             # Start an existing production build
npm run generate:types    # Regenerate types after changing the CMS schema
npm run migrate:create    # Generate a migration after schema changes
npm run production:export # Copy current local content for its first production deployment
```

Type checking, linting, and all nine homepage integration tests have been verified. Browser checks cover video playback, gallery filtering, 3D controls, reduced-motion preferences, mobile layouts, and error states. Production checks also passed for standalone startup, fresh database migrations, existing-content transfer, administrator login, uploads, the health endpoint, and persistence after recreating the container. The Dockerfile was built and run with Podman in Docker image format; Docker Engine was not installed on the development machine.

## Tests

`npm test` checks public read access, authenticated editing, image upload relationships, required fields, button link validation, an empty homepage, and Hero Video upload relationships and playback settings. It also checks that an image cannot be selected as a video or a video as a poster. Gallery tests cover ordered images, captions, multiple tags, filtering, untagged images, duplicate tag normalization, missing images, and rejection of video files. 3D View tests cover GLB uploads, public model relationships, rotation settings, speed limits, anonymous write rejection, and invalid file headers and extensions. Tests use a separate temporary SQLite database and upload directory, which are removed after the test run. Existing accounts and content are not used by these tests.

The test runner uses one process and exits after the tests finish because the development schema tooling starts background services.

## Dependencies

Payload and its SQLite, admin UI, and rich text packages use version **3.91.0**. Next.js is **16.4.2**, React and React DOM are **19.2.6**, and sharp is **0.35.5**.

See `package.json` for direct dependencies and `package-lock.json` for the complete locked dependency tree. Use `npm ci` to install the locked versions.

The project started from the official Payload starter generated with `create-payload-app@3.91.0`. Next.js and sharp were updated to patched versions. Sass and DOMPurify overrides are listed in `package.json`.
