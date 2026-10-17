import type { GlobalConfig } from 'payload'
import { HeroBlock } from '../blocks/HeroBlock'
import { HeroVideo } from '../blocks/HeroVideo'
import { ImageGallery } from '../blocks/ImageGallery'
import { ThreeDView } from '../blocks/ThreeDView'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Homepage',
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'layout',
      label: 'Page blocks',
      type: 'blocks',
      blocks: [HeroBlock, HeroVideo, ThreeDView, ImageGallery],
    },
  ],
}
