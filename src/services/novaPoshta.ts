import { CityOption, WarehouseOption } from '../types';

const API_URL = 'https://api.novaposhta.ua/v2.0/json/';
const API_KEY = import.meta.env.VITE_NOVA_POSHTA_API_KEY;

if (!API_KEY) {
  console.warn('VITE_NOVA_POSHTA_API_KEY is not set in environment variables');
}

interface NovaPoshtaResponse<T> {
  success: boolean;
  data: T;
  errors: string[];
  warnings: string[];
  info: string[];
}

interface Settlement {
  Ref: string;
  Description: string;
  Area: string;
  Region: string;
  // Додаткові поля, які може повертати API
  [key: string]: any;
}

interface Address {
  Ref: string;
  MainDescription: string;
  Description: string;
  Area: string;
  Region: string;
  DeliveryCity: string;
  Warehouses: number;
  Present: string;
  // Додаткові поля, які може повертати API
  [key: string]: any;
}

interface SettlementResponse {
  TotalCount: number;
  Addresses: Address[];
  // Додаткові поля, які може повертати API
  [key: string]: any;
}

interface Warehouse {
  Ref: string;
  Description: string;
  CityRef: string;
  Number: string;
  // Додаткові поля, які може повертати API
  [key: string]: any;
}

// Export the interfaces from the main types file
export type { CityOption, WarehouseOption } from '../types';

/**
 * Search settlements (cities) by name
 * @param cityName - The name of the city to search for
 * @returns Promise resolving to array of CityOption objects
 */
export async function searchSettlements(cityName: string): Promise<CityOption[]> {
  try {
    const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "apiKey": import.meta.env.VITE_NOVA_POSHTA_API_KEY,
        "modelName": "Address",
        "calledMethod": "searchSettlements",
        "methodProperties": {
          "CityName": cityName,
          "Limit": 50
        }
      })
    });

    const data: NovaPoshtaResponse<SettlementResponse> = await response.json();
    
    if (!data.success) {
      throw new Error(data.errors.join(', '));
    }

    // Map the response to our CityOption format
    let mapped: CityOption[] = [];
    
    if (data.data[0]?.Addresses) {
      // New API format with Addresses array
      mapped = data.data[0].Addresses.map((address: any) => ({
        value: address.DeliveryCity,
        label: `${address.Present} (${address.MainDescription})`,
        ref: address.DeliveryCity // Use DeliveryCity as ref for new format
      }));
    } else {
      // Old API format
      mapped = data.data.map((item: any) => ({
        value: item.Ref,
        label: item.Present,
        ref: item.Ref
      }));
    }

    return mapped;
  } catch (error) {
    console.error('Error searching settlements:', error);
    return [];
  }
}

/**
 * Get warehouses for a specific city
 * @param cityRef - The reference ID of the city
 * @returns Promise resolving to array of WarehouseOption objects
 */
export async function getWarehouses(cityRef: string): Promise<WarehouseOption[]> {
  try {
    const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "apiKey": import.meta.env.VITE_NOVA_POSHTA_API_KEY,
        "modelName": "Address",
        "calledMethod": "getWarehouses",
        "methodProperties": {
          "CityRef": cityRef
        }
      })
    });

    const data: NovaPoshtaResponse<Warehouse[]> = await response.json();
    
    if (!data.success) {
      throw new Error(data.errors.join(', '));
    }

    // Map the response to our WarehouseOption format
    const mapped: WarehouseOption[] = data.data.map(item => ({
      value: item.Ref,
      label: item.Description,
      ref: item.Ref
    }));

    return mapped;
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return [];
  }
}
