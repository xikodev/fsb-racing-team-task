import { APIError, type CollectionConfig } from 'payload'

export const Models: CollectionConfig = {
  slug: 'models',
  labels: { singular: '3D Model', plural: '3D Models' },
  admin: { description: 'Supported format: GLB (.glb), with textures embedded in the file.' },
  access: { read: () => true },
  fields: [{ name: 'alt', label: 'Model description', type: 'text', required: true }],
  upload: { mimeTypes: ['model/gltf-binary', 'application/octet-stream'] },
  hooks: {
    beforeOperation: [
      ({ args, operation }) => {
        if (operation !== 'create' && operation !== 'update') return args
        const file = args.req.file
        if (!file) return args
        const data = file.data
        if (
          !file.name.toLowerCase().endsWith('.glb') ||
          data.length < 20 ||
          data.toString('ascii', 0, 4) !== 'glTF' ||
          data.readUInt32LE(4) !== 2 ||
          data.readUInt32LE(8) !== data.length
        ) {
          throw new APIError(
            'Upload a valid GLB 2.0 file (.glb). Other formats are not supported.',
            400,
          )
        }
        file.mimetype = 'model/gltf-binary'
        return args
      },
    ],
  },
}
