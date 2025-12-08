// Константи для заміни запитів до бази даних
// Використовується замість pg_timezone_names запитів

export const TIMEZONES = [
  'Europe/Kiev',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
] as const;

export type Timezone = typeof TIMEZONES[number];

