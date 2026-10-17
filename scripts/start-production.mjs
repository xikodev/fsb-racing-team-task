import 'dotenv/config'
import { spawn } from 'node:child_process'
import { cp, mkdir } from 'node:fs/promises'
import path from 'node:path'

if (!process.env.DATA_DIR || !process.env.DATABASE_URL?.startsWith('file:')) {
  throw new Error(
    'Set DATA_DIR and a local production DATABASE_URL. See the production instructions in README.md.',
  )
}
const dataDirectory = path.resolve(process.env.DATA_DIR)
const databaseURL = `file:${path.resolve(process.env.DATABASE_URL.slice(5))}`
await mkdir(dataDirectory, { recursive: true })
const standalone = path.resolve('.next/standalone')
await cp('.next/static', path.join(standalone, '.next/static'), { recursive: true })
const child = spawn(process.execPath, [path.join(standalone, 'server.js')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    DATA_DIR: dataDirectory,
    DATABASE_URL: databaseURL,
    HOSTNAME: process.env.HOSTNAME || '0.0.0.0',
  },
})
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal))
}
child.on('error', (error) => {
  console.error(error.message)
  process.exitCode = 1
})
child.on('exit', (code) => {
  process.exitCode = code ?? 1
})
