
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Network Timeout'))
    }, timeoutMs)
  })

  
  return Promise.race([promise, timeoutPromise])
}


export async function safeRequest<T>(
  requestFn: () => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  try {
    const result = await withTimeout(requestFn(), timeoutMs)
    return result
  } catch (error) {
    
    throw error
  }
}