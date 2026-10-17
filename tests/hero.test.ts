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
  assert.ok(hero?.blockType === 'hero')
  assert.equal(hero.title, 'A new season')
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

test('Hero Video saves an uploaded video, poster, and playback settings', async () => {
  const video = await payload.create({
    collection: 'media',
    data: { alt: 'Test video' },
    filePath: path.resolve('tests/fixtures/hero-video.webm'),
  })
  const poster = (
    await payload.find({
      collection: 'media',
      where: { mimeType: { contains: 'image/' } },
      limit: 1,
    })
  ).docs[0]
  assert.ok(poster)
  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      layout: [
        {
          blockType: 'heroVideo',
          title: 'On track',
          description: 'Testing the next lap.',
          video: video.id,
          poster: poster.id,
          autoplay: true,
          loop: true,
        },
      ],
    },
  })
  const saved = (await payload.findGlobal({ slug: 'homepage', depth: 1, overrideAccess: false }))
    .layout?.[0]
  assert.ok(saved?.blockType === 'heroVideo')
  assert.equal(saved.autoplay, true)
  assert.equal(saved.loop, true)
  assert.ok(typeof saved.video === 'object')
  assert.equal(saved.video.mimeType, 'video/webm')
  assert.ok(saved.poster && typeof saved.poster === 'object')
  assert.equal(saved.poster.id, poster.id)

  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      layout: [
        {
          blockType: 'heroVideo',
          title: 'Manual playback',
          video: video.id,
          autoplay: false,
          loop: false,
        },
      ],
    },
  })
  const manual = (await payload.findGlobal({ slug: 'homepage' })).layout?.[0]
  assert.ok(manual?.blockType === 'heroVideo')
  assert.equal(manual.autoplay, false)
  assert.equal(manual.loop, false)

  for (const block of [
    { blockType: 'heroVideo' as const, title: 'Missing video' },
    { blockType: 'heroVideo' as const, title: 'Wrong type', video: poster.id },
    { blockType: 'heroVideo' as const, title: 'Wrong poster', video: video.id, poster: video.id },
  ]) {
    await assert.rejects(() =>
      payload.updateGlobal({ slug: 'homepage', data: { layout: [block] } }),
    )
  }
})

test('Image Gallery saves ordered images, captions, and multiple tags', async () => {
  const editor = (await payload.find({ collection: 'users', limit: 1 })).docs[0]
  const image = (
    await payload.find({
      collection: 'media',
      where: { mimeType: { contains: 'image/' } },
      limit: 1,
    })
  ).docs[0]
  assert.ok(editor && image)
  await payload.updateGlobal({
    slug: 'homepage',
    overrideAccess: false,
    user: { ...editor, collection: 'users' },
    data: {
      layout: [
        {
          blockType: 'imageGallery',
          title: 'Life at the track',
          description: 'Built together.',
          images: [
            {
              image: image.id,
              caption: 'First lap',
              tags: [{ tag: 'Testing' }, { tag: 'Competition' }],
            },
            {
              image: image.id,
              caption: 'In the workshop',
              tags: [{ tag: ' Workshop ' }, { tag: 'workshop' }],
            },
            { image: image.id, caption: 'Team photo' },
          ],
        },
      ],
    },
  })
  const block = (await payload.findGlobal({ slug: 'homepage', depth: 1, overrideAccess: false }))
    .layout?.[0]
  assert.ok(block?.blockType === 'imageGallery')
  assert.deepEqual(
    block.images.map(({ caption }) => caption),
    ['First lap', 'In the workshop', 'Team photo'],
  )
  assert.ok(typeof block.images[0].image === 'object')
  assert.equal(block.images[0].image.alt, 'Test car photo')
  const { getGalleryImages, filterGalleryImages } = await import('../src/components/gallery')
  const images = getGalleryImages(block.images)
  assert.equal(filterGalleryImages(images, null).length, 3)
  assert.equal(filterGalleryImages(images, 'testing')[0].caption, 'First lap')
  assert.equal(filterGalleryImages(images, 'competition')[0].caption, 'First lap')
  assert.equal(filterGalleryImages(images, 'workshop').length, 1)
  assert.equal(images[1].tags.length, 1)
  assert.equal(filterGalleryImages(images, 'missing').length, 0)
  assert.equal(getGalleryImages([{ image: image.id }]).length, 0)
})

test('Image Gallery rejects missing images, empty tags, and video uploads', async () => {
  const image = (
    await payload.find({
      collection: 'media',
      where: { mimeType: { contains: 'image/' } },
      limit: 1,
    })
  ).docs[0]
  const video = (
    await payload.find({
      collection: 'media',
      where: { mimeType: { equals: 'video/webm' } },
      limit: 1,
    })
  ).docs[0]
  assert.ok(image && video)
  for (const block of [
    { blockType: 'imageGallery' as const, title: 'Empty', images: [] },
    { blockType: 'imageGallery' as const, title: 'Missing image', images: [{}] },
    { blockType: 'imageGallery' as const, title: '', images: [{ image: image.id }] },
    { blockType: 'imageGallery' as const, title: 'Video', images: [{ image: video.id }] },
    {
      blockType: 'imageGallery' as const,
      title: 'Empty tag',
      images: [{ image: image.id, tags: [{ tag: '' }] }],
    },
  ]) {
    await assert.rejects(() =>
      payload.updateGlobal({ slug: 'homepage', data: { layout: [block] } }),
    )
  }
})
