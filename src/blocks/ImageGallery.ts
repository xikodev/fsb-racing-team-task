import type { Block } from 'payload'

export const ImageGallery: Block = {
  slug: 'imageGallery',
  interfaceName: 'ImageGalleryBlock',
  labels: { singular: 'Image Gallery', plural: 'Image Galleries' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'images',
      type: 'array',
      required: true,
      minRows: 1,
      admin: { description: 'Add images in the order they should appear in the gallery.' },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          filterOptions: { mimeType: { contains: 'image/' } },
        },
        { name: 'caption', type: 'text' },
        {
          name: 'tags',
          type: 'array',
          admin: {
            description: 'Optional filters, for example Workshop, Testing, or Competition.',
          },
          fields: [{ name: 'tag', type: 'text', required: true }],
        },
      ],
    },
  ],
}
