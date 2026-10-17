import type { ThreeDViewBlock } from '@/payload-types'
import { ModelViewer } from './ModelViewer'

type Props = ThreeDViewBlock & { first?: boolean }

export function ThreeDView({
  title,
  description,
  model,
  rotate,
  rotationSpeed,
  first = false,
}: Props) {
  const file = model && typeof model === 'object' && model.url ? model : null
  const Heading = first ? 'h1' : 'h2'

  return (
    <section className="three-d-view">
      <p className="eyebrow">FSB Racing Team / Explore in 3D</p>
      <Heading>{title}</Heading>
      {description && <p className="hero-description">{description}</p>}
      {file ? (
        <ModelViewer
          key={file.url}
          src={file.url!}
          alt={file.alt}
          rotate={Boolean(rotate)}
          speed={rotationSpeed}
        />
      ) : (
        <p>The 3D model is currently unavailable.</p>
      )}
    </section>
  )
}
