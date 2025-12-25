


export const TIMEZONES = [
  'Europe/Kiev',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
] as const;

export type Timezone = typeof TIMEZONES[number];

