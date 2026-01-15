// Ukrposhta API service
// Supports both mock mode (for development) and real API mode (for production)

import { CityOption, WarehouseOption } from '../types';

// Configuration
const USE_MOCK_DATA = import.meta.env.VITE_USE_UKRPOSHTA_MOCK === 'true';
const API_BASE_URL = '/functions/v1/ukrposhta'; // Supabase edge function endpoint

// Mock data for development
const MOCK_CITIES: CityOption[] = [
  { value: 'kyiv', label: 'Київ', ref: 'kyiv-ref' },
  { value: 'lviv', label: 'Львів', ref: 'lviv-ref' },
  { value: 'odesa', label: 'Одеса', ref: 'odesa-ref' },
  { value: 'kharkiv', label: 'Харків', ref: 'kharkiv-ref' },
  { value: 'dnipro', label: 'Дніпро', ref: 'dnipro-ref' },
  { value: 'zaporizhzhia', label: 'Запоріжжя', ref: 'zaporizhzhia-ref' },
];

const MOCK_WAREHOUSES: Record<string, WarehouseOption[]> = {
  'kyiv-ref': [
    { value: 'kyiv-1', label: '01001 - Відділення №1 (вул. Хрещатик, 1)', ref: 'kyiv-1-ref', street: 'Хрещатик', number: '1', postcode: '01001' },
    { value: 'kyiv-2', label: '01002 - Відділення №2 (вул. Дмитрівська, 10)', ref: 'kyiv-2-ref', street: 'Дмитрівська', number: '10', postcode: '01002' },
    { value: 'kyiv-3', label: '01003 - Відділення №3 (вул. Липська, 15)', ref: 'kyiv-3-ref', street: 'Липська', number: '15', postcode: '01003' },
    { value: 'kyiv-4', label: '01004 - Відділення №4 (вул. Дмитрівська, 5)', ref: 'kyiv-4-ref', street: 'Дмитрівська', number: '5', postcode: '01004' },
    { value: 'kyiv-5', label: '01005 - Відділення №5 (вул. Хрещатик, 15)', ref: 'kyiv-5-ref', street: 'Хрещатик', number: '15', postcode: '01005' },
  ],
  'lviv-ref': [
    { value: 'lviv-1', label: '79000 - Відділення №1 (пл. Ринок, 1)', ref: 'lviv-1-ref', street: 'Ринок', number: '1', postcode: '79000' },
    { value: 'lviv-2', label: '79001 - Відділення №2 (вул. Городоцька, 20)', ref: 'lviv-2-ref', street: 'Городоцька', number: '20', postcode: '79001' },
    { value: 'lviv-3', label: '79002 - Відділення №3 (вул. Городоцька, 5)', ref: 'lviv-3-ref', street: 'Городоцька', number: '5', postcode: '79002' },
  ],
  'odesa-ref': [
    { value: 'odesa-1', label: '65000 - Відділення №1 (вул. Дерибасівська, 10)', ref: 'odesa-1-ref', street: 'Дерибасівська', number: '10', postcode: '65000' },
    { value: 'odesa-2', label: '65001 - Відділення №2 (вул. Преображенська, 5)', ref: 'odesa-2-ref', street: 'Преображенська', number: '5', postcode: '65001' },
    { value: 'odesa-3', label: '65002 - Відділення №3 (вул. Дерибасівська, 25)', ref: 'odesa-3-ref', street: 'Дерибасівська', number: '25', postcode: '65002' },
  ],
};

/**
 * Search cities by name
 * Uses mock data in development, real API in production
 */
export async function searchCities(query: string): Promise<CityOption[]> {
  // Validate input
  if (!query || query.trim().length < 2) {
    return [];
  }

  if (USE_MOCK_DATA) {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 300));
    const filtered = MOCK_CITIES.filter(city => 
      city.label.toLowerCase().includes(query.toLowerCase())
    );
    return filtered.slice(0, 10);
  }

  // Real API implementation
  try {
    const response = await fetch(`${API_BASE_URL}?action=cities&query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching cities:', error);
    throw new Error(`Failed to search cities: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Search warehouses with advanced filtering by street, number, or postcode
 * Shows all warehouses immediately when opened (empty query)
 */
export async function searchWarehouses(cityId: string, query: string = ''): Promise<WarehouseOption[]> {
  if (!cityId) {
    return [];
  }

  if (USE_MOCK_DATA) {
    // Mock implementation with advanced search
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const warehouses = MOCK_WAREHOUSES[cityId] || [];
    
    // If no query, return all warehouses (immediate display)
    if (!query.trim()) {
      return warehouses;
    }
    
    // Advanced search by street, number, postcode, or department number
    const searchTerm = query.toLowerCase().trim();
    
    return warehouses.filter(warehouse => {
      // Search by department number (extract from label)
      const deptNumberMatch = warehouse.label.match(/№(\d+)/);
      const deptNumber = deptNumberMatch ? deptNumberMatch[1] : '';
      
      // Search by postcode
      const postcodeMatch = warehouse.label.match(/(\d{5})/);
      const postcode = postcodeMatch ? postcodeMatch[1] : '';
      
      return (
        // By department number
        deptNumber.includes(searchTerm) ||
        // By street name
        (warehouse as any).street?.toLowerCase().includes(searchTerm) ||
        // By street number
        (warehouse as any).number?.includes(searchTerm) ||
        // By postcode
        postcode.includes(searchTerm) ||
        // By full label
        warehouse.label.toLowerCase().includes(searchTerm)
      );
    });
  }

  // Real API implementation
  try {
    const response = await fetch(`${API_BASE_URL}?action=warehouses&cityId=${encodeURIComponent(cityId)}&query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching warehouses:', error);
    throw new Error(`Failed to search warehouses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all warehouses for a specific city (deprecated - use searchWarehouses instead)
 */
export async function getWarehouses(cityId: string): Promise<WarehouseOption[]> {
  return searchWarehouses(cityId, '');
}

/**
 * Create TTN for Ukrposhta delivery
 * Uses mock data in development, real API in production
 */
export async function createTTN(orderData: any): Promise<any> {
  if (USE_MOCK_DATA) {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      ttn: `UP${Date.now()}`,
      shipment_id: `shipment_${Date.now()}`,
      estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  // Real API implementation
  try {
    const response = await fetch(`${API_BASE_URL}?action=create-ttn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderData }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating TTN:', error);
    throw new Error(`Failed to create TTN: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export type { CityOption, WarehouseOption };