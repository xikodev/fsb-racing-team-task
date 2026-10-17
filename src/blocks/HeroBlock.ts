import type { Block, TextFieldSingleValidation } from 'payload'
import type { HeroBlock as HeroData } from '../payload-types'

const validateButtonLabel: TextFieldSingleValidation = (value, { siblingData }) => {
  const button = siblingData as Partial<HeroData>
  return !button?.buttonLink || Boolean(value?.trim()) || 'Add a button label.'
}

const validateButtonLink: TextFieldSingleValidation = (value, { siblingData }) => {
  const button = siblingData as Partial<HeroData>
  if (!value) return !button?.buttonLabel || 'Add a button link.'
  if (value !== value.trim()) return 'Remove spaces around the link.'
  if (/^#[^\s]+$/.test(value) || /^\/(?![\/\\])[^\s\\]*$/.test(value)) return true
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' || url.protocol === 'http:') return true
  } catch {
    // Relative links are handled above.
  }
  return 'Use a path starting with /, an anchor starting with #, or an HTTP(S) URL.'
}

export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: {
    singular: 'Hero Block',
    plural: 'Hero Blocks',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      defaultValue: 'Built by students.\nDriven by ambition.',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image/' } },
      admin: { description: 'Optional. Choose an image from Media or upload a new one.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'buttonLabel',
          type: 'text',
          admin: { width: '50%' },
          validate: validateButtonLabel,
        },
        {
          name: 'buttonLink',
          type: 'text',
          admin: {
            width: '50%',
            description:
              'A page path, an anchor, or a full HTTP(S) URL. Leave both button fields empty to hide it.',
          },
          validate: validateButtonLink,
        },
      ],
    },
  ],
}
