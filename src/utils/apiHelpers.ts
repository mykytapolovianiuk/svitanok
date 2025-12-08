/**
 * Wraps a promise with a timeout
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds (default: 10 seconds)
 * @returns Promise that rejects if the original promise takes too long
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  // Create a timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Network Timeout'))
    }, timeoutMs)
  })

  // Race the original promise against the timeout
  return Promise.race([promise, timeoutPromise])
}

/**
 * Safe request wrapper that ensures cleanup even if the request fails
 * @param requestFn - Function that returns a promise
 * @param timeoutMs - Timeout in milliseconds (default: 10 seconds)
 * @returns Promise with result or error
 */
export async function safeRequest<T>(
  requestFn: () => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  try {
    const result = await withTimeout(requestFn(), timeoutMs)
    return result
  } catch (error) {
    // Re-throw the error for the caller to handle
    throw error
  }
}