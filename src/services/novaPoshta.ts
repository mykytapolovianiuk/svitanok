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

// Експортуємо інтерфейси з основного файлу типів
export type { CityOption, WarehouseOption } from '../types';

// Пошук населених пунктів (міст) за назвою
// @param cityName - Назва міста для пошуку
// @returns Promise, що повертає масив об'єктів CityOption
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

    // Відображаємо відповідь у наш формат CityOption
    let mapped: CityOption[] = [];
    
    if (data.data[0]?.Addresses) {
      // Новий формат API з масивом Addresses
      mapped = data.data[0].Addresses.map((address: any) => ({
        value: address.DeliveryCity,
        label: `${address.Present} (${address.MainDescription})`,
        ref: address.DeliveryCity // Використовуємо DeliveryCity як ref для нового формату
      }));
    } else {
      // Старий формат API
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

// Отримати склади для конкретного міста
// @param cityRef - ID посилання міста
// @returns Promise, що повертає масив об'єктів WarehouseOption
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

    // Відображаємо відповідь у наш формат WarehouseOption
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
