import type { ImageGalleryBlock } from '@/payload-types'
import { GalleryImages } from './GalleryImages'
import { getGalleryImages } from './gallery'

type Props = ImageGalleryBlock & { first?: boolean }

export function ImageGallery({ title, description, images, first = false }: Props) {
  const Heading = first ? 'h1' : 'h2'

  return (
    <section className="image-gallery">
      <p className="eyebrow">FSB Racing Team / Behind the scenes</p>
      <Heading>{title}</Heading>
      {description && <p className="hero-description">{description}</p>}
      <GalleryImages images={getGalleryImages(images)} />
    </section>
  )
}
