import type { HeroVideoBlock } from '@/payload-types'
import { VideoPlayer } from './VideoPlayer'

type Props = HeroVideoBlock & { first?: boolean }

export function HeroVideo({
  title,
  description,
  video,
  poster,
  autoplay,
  loop,
  first = false,
}: Props) {
  const file = video && typeof video === 'object' ? video : null
  const image = poster && typeof poster === 'object' ? poster : null
  const Heading = first ? 'h1' : 'h2'

  return (
    <section className="hero-video">
      <div className="video-heading">
        <div>
          <p className="eyebrow">FSB Racing Team / In motion</p>
          <Heading>{title}</Heading>
        </div>
        {description && <p className="hero-description">{description}</p>}
      </div>
      <div className="video-frame">
        {file?.url ? (
          <VideoPlayer
            key={file.url}
            src={file.url}
            title={title}
            poster={image?.url || undefined}
            autoplay={Boolean(autoplay)}
            loop={Boolean(loop)}
          />
        ) : (
          <p className="video-error">The video is currently unavailable.</p>
        )}
      </div>
    </section>
  )
}
