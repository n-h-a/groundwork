export type IconName = 'corn' | 'soybean' | 'wheat' | 'clover' | 'rain' | 'soil'

// Crop ids in rotations.json -> icon names.
export const CROP_ICON: Record<string, IconName> = {
  corn: 'corn',
  soybean: 'soybean',
  winter_wheat: 'wheat',
  red_clover: 'clover',
}
