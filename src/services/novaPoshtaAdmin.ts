/**
 * Nova Poshta Admin Service
 * Service for creating TTN (waybills) for orders
 */

/**
 * Create TTN for an order
 * @param orderId - The ID of the order to create TTN for
 * @returns Promise with TTN creation result
 */
export async function createTTN(orderId: string): Promise<{ success: boolean; ttn?: string; error?: string }> {
  try {
    const response = await fetch('/api/create-ttn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create TTN');
    }

    return {
      success: true,
      ttn: result.ttn,
    };
  } catch (error) {
    console.error('Error creating TTN:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}