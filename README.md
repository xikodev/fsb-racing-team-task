# FSB Racing Team - Recruitment Task

A Payload CMS project built with Next.js and SQLite.

The initial setup includes the starter homepage, an admin panel, and the Users and Media collections. Hero Block, Hero Video, 3D View, and Image Gallery will be added next.

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

## Environment variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | SQLite database path. Defaults to `file:./payload.db` in the example configuration. |
| `PAYLOAD_SECRET` | A random secret used for authentication. Keep it private. |

Payload creates the database during the first development startup. Uploaded files are stored in `media/`. The database, uploads, `.env`, installed dependencies, and build output are excluded from Git.

## Commands

```bash
npm run dev               # Start the development server
npm run typecheck         # Check TypeScript types
npm run lint              # Run ESLint
npm run build             # Create a production build
npm run start             # Start an existing production build
npm run generate:types    # Regenerate types after changing the CMS schema
```

Development startup, authentication, type checking, and linting have been verified. The production build has not yet been fully verified because previous attempts were interrupted by IDE crashes. Production database migrations and Docker setup will be added in a later step.

## Dependencies

Payload and its SQLite, admin UI, and rich text packages use version **3.91.0**. Next.js is **16.4.2**, React and React DOM are **19.2.6**, and sharp is **0.35.5**.

See `package.json` for direct dependencies and `package-lock.json` for the complete locked dependency tree. Use `npm ci` to install the locked versions.

The project started from the official Payload starter generated with `create-payload-app@3.91.0`. Next.js and sharp were updated to patched versions. Sass and DOMPurify overrides are listed in `package.json`.
