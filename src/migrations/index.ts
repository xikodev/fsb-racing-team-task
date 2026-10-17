import * as migration_20261017_193635_initial from './20261017_193635_initial'

export const migrations = [
  {
    up: migration_20261017_193635_initial.up,
    down: migration_20261017_193635_initial.down,
    name: '20261017_193635_initial',
  },
]
