



export interface CityOption {
  value: string;
  label: string;
  ref?: string; 
}

export interface WarehouseOption {
  value: string;
  label: string;
  ref?: string; 
}


export async function searchCities(query: string): Promise<CityOption[]> {
  
  if (!query || query.trim().length < 2) {
    return [];
  }

  
  await new Promise(resolve => setTimeout(resolve, 300));

  
  const mockCities: CityOption[] = [
    { value: 'kyiv', label: 'Київ', ref: 'kyiv-ref' },
    { value: 'lviv', label: 'Львів', ref: 'lviv-ref' },
    { value: 'odesa', label: 'Одеса', ref: 'odesa-ref' },
    { value: 'kharkiv', label: 'Харків', ref: 'kharkiv-ref' },
    { value: 'dnipro', label: 'Дніпро', ref: 'dnipro-ref' },
    { value: 'zaporizhzhia', label: 'Запоріжжя', ref: 'zaporizhzhia-ref' },
  ];

  
  const filtered = mockCities.filter(city => 
    city.label.toLowerCase().includes(query.toLowerCase())
  );

  return filtered.slice(0, 10); 
}


export async function getWarehouses(cityId: string): Promise<WarehouseOption[]> {
  
  await new Promise(resolve => setTimeout(resolve, 300));

  
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


