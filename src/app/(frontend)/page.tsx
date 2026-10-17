import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Hero } from '@/components/Hero'
import { HeroVideo } from '@/components/HeroVideo'
import { ImageGallery } from '@/components/ImageGallery'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await getPayload({ config })
  const homepage = await payload.findGlobal({
    slug: 'homepage',
    depth: 1,
    overrideAccess: false,
  })

  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/">
          FSB <span>Racing Team</span>
        </Link>
        <Link className="admin-link" href="/admin" prefetch={false}>
          Admin panel <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <main id="main-content">
        {homepage.layout?.length ? (
          homepage.layout.map((block, index) => {
            switch (block.blockType) {
              case 'imageGallery':
                return <ImageGallery key={block.id || index} {...block} first={index === 0} />
              case 'heroVideo':
                return <HeroVideo key={block.id || index} {...block} first={index === 0} />
              case 'hero':
                return <Hero key={block.id || index} {...block} first={index === 0} />
            }
          })
        ) : (
          <section className="empty-state">
            <h1>FSB Racing Team</h1>
            <p>More coming soon.</p>
          </section>
        )}
      </main>
      <footer className="site-footer">
        FSB Racing Team <span>Student engineering. Shared ambition.</span>
      </footer>
    </>
  )
}
