import type { ImageGalleryBlock } from '../payload-types'

export function getGalleryImages(images: ImageGalleryBlock['images']) {
  return images.flatMap((entry) => {
    const image = entry.image
    if (!image || typeof image !== 'object' || !image.url) return []

    const tags = new Map<string, string>()
    for (const { tag } of entry.tags || []) {
      const label = tag.trim()
      if (label) tags.set(label.toLowerCase(), label)
    }
    return [{ ...entry, image, tags: Array.from(tags, ([value, label]) => ({ value, label })) }]
  })
}

export function filterGalleryImages(
  images: ReturnType<typeof getGalleryImages>,
  tag: string | null,
) {
  return tag === null
    ? images
    : images.filter((image) => image.tags.some(({ value }) => value === tag))
}
