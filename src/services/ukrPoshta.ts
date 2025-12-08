// Ukrposhta API service
// Note: Ukrposhta has limited public API compared to Nova Poshta
// We'll implement a mock service that can be extended later

export interface CityOption {
  value: string;
  label: string;
  ref?: string; // Made ref optional to match AsyncSelect expectations
}

export interface WarehouseOption {
  value: string;
  label: string;
  ref?: string; // Made ref optional to match AsyncSelect expectations
}

/**
 * Search cities by name
 * Note: This is a mock implementation since Ukrposhta doesn't have a public API endpoint for this
 * In a real implementation, you would need to use Ukrposhta's official API or a proxy
 */
export async function searchCities(query: string): Promise<CityOption[]> {
  // Validate input
  if (!query || query.trim().length < 2) {
    return [];
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Mock data - in a real implementation, this would come from Ukrposhta API
  const mockCities: CityOption[] = [
    { value: 'kyiv', label: 'Київ', ref: 'kyiv-ref' },
    { value: 'lviv', label: 'Львів', ref: 'lviv-ref' },
    { value: 'odesa', label: 'Одеса', ref: 'odesa-ref' },
    { value: 'kharkiv', label: 'Харків', ref: 'kharkiv-ref' },
    { value: 'dnipro', label: 'Дніпро', ref: 'dnipro-ref' },
    { value: 'zaporizhzhia', label: 'Запоріжжя', ref: 'zaporizhzhia-ref' },
  ];

  // Filter based on input
  const filtered = mockCities.filter(city => 
    city.label.toLowerCase().includes(query.toLowerCase())
  );

  return filtered.slice(0, 10); // Return max 10 results
}

/**
 * Get warehouses (post offices) for a specific city
 * Note: This is a mock implementation since Ukrposhta doesn't have a public API endpoint for this
 * In a real implementation, you would need to use Ukrposhta's official API or a proxy
 */
export async function getWarehouses(cityId: string): Promise<WarehouseOption[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Mock data - in a real implementation, this would come from Ukrposhta API
  const warehousesByCity: Record<string, WarehouseOption[]> = {
    'kyiv-ref': [
      { value: 'kyiv-1', label: '01001 - Відділення №1 (вул. Хрещатик, 1)', ref: 'kyiv-1-ref' },
      { value: 'kyiv-2', label: '01002 - Відділення №2 (вул. Дмитрівська, 10)', ref: 'kyiv-2-ref' },
      { value: 'kyiv-3', label: '01003 - Відділення №3 (вул. Липська, 15)', ref: 'kyiv-3-ref' },
    ],
    'lviv-ref': [
      { value: 'lviv-1', label: '79000 - Відділення №1 (пл. Ринок, 1)', ref: 'lviv-1-ref' },
      { value: 'lviv-2', label: '79001 - Відділення №2 (вул. Городоцька, 20)', ref: 'lviv-2-ref' },
    ],
    'odesa-ref': [
      { value: 'odesa-1', label: '65000 - Відділення №1 (вул. Дерибасівська, 10)', ref: 'odesa-1-ref' },
      { value: 'odesa-2', label: '65001 - Відділення №2 (вул. Преображенська, 5)', ref: 'odesa-2-ref' },
    ],
  };

  return warehousesByCity[cityId] || [];
}

// Real Ukrposhta API implementation would look something like this:
/*
const API_BASE_URL = 'https://ukrposhta.ua/'; // Actual base URL would be provided by Ukrposhta
const API_KEY = import.meta.env.VITE_UKRPOSHTA_API_KEY;

export async function searchCitiesReal(cityName: string): Promise<CityOption[]> {
  if (!API_KEY) {
    throw new Error('Ukrposhta API key is not configured');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/some-endpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        // Request payload for Ukrposhta API
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform Ukrposhta response to our format
    return data.results.map((item: any) => ({
      value: item.name,
      label: `${item.name}, ${item.region}`,
      ref: item.id
    }));
  } catch (error) {
    console.error('Error searching cities:', error);
    throw new Error(`Failed to search cities: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
*/