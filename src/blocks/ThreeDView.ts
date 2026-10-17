import type { Block } from 'payload'

export const ThreeDView: Block = {
  slug: 'threeDView',
  interfaceName: 'ThreeDViewBlock',
  labels: { singular: '3D View', plural: '3D Views' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'model',
      type: 'upload',
      relationTo: 'models',
      required: true,
      admin: {
        description: 'Supported format: GLB (.glb). Embed textures when exporting the model.',
      },
    },
    { name: 'rotate', label: 'Automatic rotation', type: 'checkbox', defaultValue: false },
    {
      name: 'rotationSpeed',
      label: 'Rotation speed (degrees per second)',
      type: 'number',
      required: true,
      defaultValue: 20,
      min: 1,
      max: 180,
      admin: {
        description: 'Used when automatic rotation is enabled. Default: 20 degrees per second.',
      },
    },
  ],
}
