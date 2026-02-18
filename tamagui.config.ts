import { config as baseConfig } from '@tamagui/config/v3'
import { createTamagui } from 'tamagui'

export const tamaguiConfig = createTamagui({
  ...baseConfig,

  themes: {
    ...baseConfig.themes,
  },
})
export const config = tamaguiConfig
export default tamaguiConfig

export type AppTamaguiConfig = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}
