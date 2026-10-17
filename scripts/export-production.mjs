import 'dotenv/config'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, rename, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { backup, DatabaseSync } from 'node:sqlite'

const destination = path.resolve(process.argv[2] || 'data')
const sourceURL = process.env.DATABASE_URL || 'file:./payload.db'
if (!sourceURL.startsWith('file:') || sourceURL.includes('?')) {
  throw new Error('Export requires a local SQLite file without URL query parameters.')
}
const source = path.resolve(sourceURL.slice(5))
await stat(source)
try {
  await stat(destination)
  throw new Error(`Destination already exists: ${destination}. Choose a new directory.`)
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
await mkdir(path.dirname(destination), { recursive: true })
const staging = await mkdtemp(path.join(path.dirname(destination), '.production-export-'))
let snapshot
let reference

function schema(database) {
  const names = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all()
  return names.map(({ name }) => {
    const quoted = JSON.stringify(name)
    const columns = database
      .prepare(`PRAGMA table_info(${quoted})`)
      .all()
      .map(({ name, type, notnull, dflt_value, pk }) => ({ name, type, notnull, dflt_value, pk }))
    const foreignKeys = database
      .prepare(`PRAGMA foreign_key_list(${quoted})`)
      .all()
      .map(({ seq, table, from, to, on_update, on_delete, match }) => ({
        seq,
        table,
        from,
        to,
        on_update,
        on_delete,
        match,
      }))
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
    const indexes = database
      .prepare(`PRAGMA index_list(${quoted})`)
      .all()
      .filter(({ origin }) => origin !== 'pk')
      .map(({ name, unique, partial }) => ({
        name,
        unique,
        partial,
        columns: database
          .prepare(`PRAGMA index_info(${JSON.stringify(name)})`)
          .all()
          .map(({ name }) => name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
    return { name, columns, foreignKeys, indexes }
  })
}

try {
  const original = new DatabaseSync(source, { readOnly: true })
  try {
    await backup(original, path.join(staging, 'payload.db'))
  } finally {
    original.close()
  }
  const referencePath = path.join(staging, 'reference.db')
  const migration = spawnSync(process.execPath, ['node_modules/payload/bin.js', 'migrate'], {
    env: { ...process.env, NODE_ENV: 'production', DATABASE_URL: `file:${referencePath}` },
    encoding: 'utf8',
    timeout: 60000,
  })
  if (migration.status !== 0) {
    throw new Error(
      `Could not prepare the reference schema. ${migration.stderr || migration.error || migration.stdout}`,
    )
  }
  snapshot = new DatabaseSync(path.join(staging, 'payload.db'))
  reference = new DatabaseSync(referencePath, { readOnly: true })
  if (JSON.stringify(schema(snapshot)) !== JSON.stringify(schema(reference))) {
    throw new Error(
      'Database schema differs from the initial production migration. The source was not changed.',
    )
  }

  const migrations = reference
    .prepare('SELECT name, batch FROM payload_migrations ORDER BY id')
    .all()
  assert.equal(
    migrations.length,
    1,
    'This export supports the initial development-to-production transition only.',
  )
  snapshot.exec('BEGIN IMMEDIATE')
  try {
    snapshot.exec('DELETE FROM payload_migrations')
    const insert = snapshot.prepare('INSERT INTO payload_migrations (name, batch) VALUES (?, ?)')
    for (const { name, batch } of migrations) insert.run(name, batch)
    snapshot.exec('COMMIT')
  } catch (error) {
    snapshot.exec('ROLLBACK')
    throw error
  }
  snapshot.close()
  snapshot = undefined
  reference.close()
  reference = undefined
  await rm(referencePath)
  for (const directory of ['media', 'models']) {
    const uploads = path.resolve(process.env.DATA_DIR || '.', directory)
    try {
      await cp(uploads, path.join(staging, directory), { recursive: true, errorOnExist: true })
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      await mkdir(path.join(staging, directory), { recursive: true })
    }
  }
  await rename(staging, destination)
  console.log(
    `Production data exported to ${destination}. The source database and uploads were not changed.`,
  )
} finally {
  snapshot?.close()
  reference?.close()
  await rm(staging, { recursive: true, force: true })
}
