import type { Fact } from '../compareTypes'

// How each fact is known. Shown as a small label on every fact, and explained
// on the How it works page.
export const STRENGTH: Record<Fact['strength'], { label: string; explanation: string }> = {
  measured_ohio: {
    label: 'Measured in Ohio',
    explanation: 'Measured in field research or monitoring in Ohio. The strongest evidence we have, though often from a few sites.',
  },
  measured_other_state: {
    label: 'Measured in another state',
    explanation: 'Measured in field research outside Ohio. Soils and weather differ, so treat it as a hint.',
  },
  crop_calendar: {
    label: 'From the crop calendar',
    explanation: 'Follows from typical Ohio planting and harvest dates, such as which months the soil is bare.',
  },
  guidance: {
    label: 'Expert guidance',
    explanation: "A judgement or recommendation by the source's authors, not a measurement.",
  },
}

export const FIT: Record<Exclude<Fact['fit']['status'], 'general'>, string> = {
  fits: 'Fits your field',
  unknown: 'Check whether this fits your field',
  may_not_apply: 'May not apply to your field',
}
