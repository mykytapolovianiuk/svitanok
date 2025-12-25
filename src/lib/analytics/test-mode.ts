


export function isTestMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  const gaId = import.meta.env.VITE_GA_ID;
  const pixelId = import.meta.env.VITE_FB_PIXEL_ID;
  const capiToken = import.meta.env.META_CAPI_ACCESS_TOKEN;
  
  return (
    import.meta.env.DEV ||
    gaId?.includes('TEST') ||
    gaId?.includes('test') ||
    pixelId?.includes('TEST') ||
    pixelId?.includes('test') ||
    capiToken === 'TEST_TOKEN'
  );
}


export function logTestEvent(eventName: string, data: Record<string, any>): void {
  if (!isTestMode()) return;
  
  console.group(`🧪 [TEST MODE] ${eventName}`);
  
  
  console.groupEnd();
}


export function getTestModeStatus(): {
  isTest: boolean;
  gaId: string | undefined;
  pixelId: string | undefined;
  capiToken: string | undefined;
} {
  return {
    isTest: isTestMode(),
    gaId: import.meta.env.VITE_GA_ID,
    pixelId: import.meta.env.VITE_FB_PIXEL_ID,
    capiToken: import.meta.env.META_CAPI_ACCESS_TOKEN,
  };
}



