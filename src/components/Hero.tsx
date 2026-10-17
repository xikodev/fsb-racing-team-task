import Image from 'next/image'
import type { HeroBlock } from '@/payload-types'

type Props = HeroBlock & { first?: boolean }

export function Hero({ title, description, image, buttonLabel, buttonLink, first = false }: Props) {
  const photo = image && typeof image === 'object' && image.url ? image : null
  const Heading = first ? 'h1' : 'h2'

  return (
    <section className={`hero${photo ? ' hero--with-image' : ''}`}>
      <div className="hero-content">
        <p className="eyebrow">FSB Racing Team / Formula Student</p>
        <Heading>{title}</Heading>
        {description && <p className="hero-description">{description}</p>}
        {buttonLabel && buttonLink && (
          <a className="button" href={buttonLink}>
            {buttonLabel} <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
      {photo && (
        <div className="hero-media">
          <Image
            src={photo.url!}
            alt={photo.alt}
            width={photo.width || 1200}
            height={photo.height || 900}
            priority={first}
            unoptimized
          />
        </div>
      )}
    </section>
  )
}
