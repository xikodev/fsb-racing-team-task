import type { Block } from 'payload'

export const HeroVideo: Block = {
  slug: 'heroVideo',
  interfaceName: 'HeroVideoBlock',
  labels: { singular: 'Hero Video', plural: 'Hero Videos' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'video',
      type: 'upload',
      relationTo: 'media',
      required: true,
      filterOptions: { mimeType: { in: ['video/mp4', 'video/webm'] } },
      admin: {
        description:
          'Upload an MP4 or WebM video. For MP4, use a browser-compatible codec such as H.264.',
      },
    },
    {
      name: 'poster',
      label: 'Poster image',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image/' } },
      admin: { description: 'Optional image displayed before the video starts.' },
    },
    {
      name: 'autoplay',
      label: 'Autoplay (muted)',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Automatically starts without sound. Disabled for visitors who prefer reduced motion. Browser settings may also prevent autoplay.',
      },
    },
    { name: 'loop', label: 'Loop video', type: 'checkbox', defaultValue: false },
  ],
}
