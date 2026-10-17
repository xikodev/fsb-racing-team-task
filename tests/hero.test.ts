import 'dotenv/config'
import type { SQLiteAdapter } from '@payloadcms/db-sqlite'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { after, before, test } from 'node:test'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'

let payload: Payload
let directory: string

before(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'fsb-hero-'))
  process.env.DATABASE_URL = `file:${path.join(directory, 'test.db')}`
  process.env.PAYLOAD_SECRET = 'isolated-test-secret-not-used-by-the-application'

  const config = await (await import('../src/payload.config')).default
  config.telemetry = false
  const media = config.collections.find((collection) => collection.slug === 'media')
  if (media && typeof media.upload === 'object') {
    media.upload.staticDir = path.join(directory, 'media')
  }
  payload = await getPayload({ config, cron: false })
})

after(async () => {
  if (payload) {
    const database = payload.db as unknown as SQLiteAdapter
    database.client.close()
  }
  if (directory) await rm(directory, { recursive: true, force: true })
})

test('Homepage is public, but anonymous updates are rejected', async () => {
  const homepage = await payload.findGlobal({ slug: 'homepage', overrideAccess: false })
  assert.ok(homepage)
  await assert.rejects(() =>
    payload.updateGlobal({
      slug: 'homepage',
      overrideAccess: false,
      data: { layout: [] },
    }),
  )
})

test('an authenticated editor can save the hero, including its uploaded image', async () => {
  const admin = await payload.create({
    collection: 'users',
    data: { email: 'hero-test@example.invalid', password: 'temporary-password-for-isolated-tests' },
  })
  const buffer = await sharp({
    create: { width: 12, height: 8, channels: 3, background: '#c91f2c' },
  })
    .png()
    .toBuffer()
  const image = await payload.create({
    collection: 'media',
    data: { alt: 'Test car photo' },
    file: { data: buffer, mimetype: 'image/png', name: 'hero-test.png', size: buffer.length },
  })
  await payload.updateGlobal({
    slug: 'homepage',
    overrideAccess: false,
    user: { ...admin, collection: 'users' },
    data: {
      layout: [
        {
          blockType: 'hero',
          title: 'A new season',
          description: 'Built together.',
          image: image.id,
          buttonLabel: 'Meet the team',
          buttonLink: 'https://example.com/team',
        },
      ],
    },
  })
  const homepage = await payload.findGlobal({ slug: 'homepage', depth: 1, overrideAccess: false })
  const hero = homepage.layout?.[0]
  assert.equal(hero?.title, 'A new season')
  assert.equal(hero?.description, 'Built together.')
  assert.equal(hero?.buttonLink, 'https://example.com/team')
  assert.ok(hero?.image && typeof hero.image === 'object')
  assert.equal(hero.image.alt, 'Test car photo')
  assert.equal(hero.image.width, 12)
})

test('missing titles, unsafe links, and incomplete buttons are rejected', async () => {
  for (const hero of [
    { blockType: 'hero' as const, title: '' },
    {
      blockType: 'hero' as const,
      title: 'Test',
      buttonLabel: 'Click',
      buttonLink: 'javascript:alert(1)',
    },
    {
      blockType: 'hero' as const,
      title: 'Test',
      buttonLabel: 'Click',
      buttonLink: '//example.com',
    },
    { blockType: 'hero' as const, title: 'Test', buttonLabel: 'Click' },
    { blockType: 'hero' as const, title: 'Test', buttonLink: '/team' },
  ]) {
    await assert.rejects(() => payload.updateGlobal({ slug: 'homepage', data: { layout: [hero] } }))
  }
})

test('optional content and an empty homepage can be saved', async () => {
  for (const link of ['/team', '#main-content', 'https://example.com']) {
    await payload.updateGlobal({
      slug: 'homepage',
      data: {
        layout: [{ blockType: 'hero', title: 'Test', buttonLabel: 'Explore', buttonLink: link }],
      },
    })
  }
  await payload.updateGlobal({
    slug: 'homepage',
    data: { layout: [{ blockType: 'hero', title: 'Title only' }] },
  })
  const homepage = await payload.findGlobal({ slug: 'homepage' })
  assert.equal(homepage.layout?.[0]?.title, 'Title only')
  await payload.updateGlobal({ slug: 'homepage', data: { layout: [] } })
  assert.equal((await payload.findGlobal({ slug: 'homepage' })).layout?.length, 0)
})
