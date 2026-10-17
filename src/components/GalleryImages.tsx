'use client'

import Image from 'next/image'
import { useId, useState } from 'react'
import { filterGalleryImages, type getGalleryImages } from './gallery'

type Props = { images: ReturnType<typeof getGalleryImages> }

export function GalleryImages({ images }: Props) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const gridId = useId()
  const tags = Array.from(
    new Map(images.flatMap((entry) => entry.tags.map((tag) => [tag.value, tag]))).values(),
  )
  const activeTag = tags.some(({ value }) => value === selectedTag) ? selectedTag : null
  const visibleImages = filterGalleryImages(images, activeTag)

  return (
    <>
      {tags.length > 0 && (
        <div className="gallery-filters" role="group" aria-label="Filter gallery by tag">
          {[{ value: null, label: 'All' }, ...tags].map(({ value, label }) => (
            <button
              key={value === null ? 'all' : `tag:${value}`}
              type="button"
              aria-pressed={activeTag === value}
              aria-controls={gridId}
              onClick={() => setSelectedTag(value)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <p className="gallery-count" role="status">
        {visibleImages.length} {visibleImages.length === 1 ? 'image' : 'images'}
      </p>
      <div className="gallery-grid" id={gridId}>
        {visibleImages.map(({ id, image, caption }, index) => (
          <figure key={id || index}>
            <Image
              src={image.url!}
              alt={image.alt}
              width={image.width || 1200}
              height={image.height || 900}
              unoptimized
            />
            {caption && <figcaption>{caption}</figcaption>}
          </figure>
        ))}
      </div>
      {images.length === 0 && <p>Gallery images are currently unavailable.</p>}
    </>
  )
}
