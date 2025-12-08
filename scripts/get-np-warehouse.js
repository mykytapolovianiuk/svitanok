import fetch from 'node-fetch';

const API_KEY = '6e5d454d862f50c90eb47c8e76af5353'; // Встав сюди свій ключ
const CITY_REF = 'db5c88d0-391c-11dd-90d9-001a9297174a'; // Ref міста Суми

async function getWarehouseInfo() {
  console.log('🔄 Отримую інформацію про склади у м. Суми...');

  try {
    // Отримуємо список складів у м. Суми
    const warehouseResponse = await fetch('https://api.novaposhta.ua/v2.0/json/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: API_KEY,
        modelName: 'Address',
        calledMethod: 'getWarehouses',
        methodProperties: { 
          CityRef: CITY_REF,
          Page: 1 
        }
      })
    }).then(r => r.json());

    if (!warehouseResponse.success || warehouseResponse.data.length === 0) {
      console.error('❌ Помилка: Не знайдено складів у м. Суми.');
      return;
    }

    console.log('\n📦 Склади у м. Суми:');
    warehouseResponse.data.forEach((warehouse, index) => {
      console.log(`${index + 1}. ${warehouse.Description} (Ref: ${warehouse.Ref})`);
    });

    console.log('\n✅ ВИКОРИСТОВУЙТЕ Ref ПЕРШОГО СКЛАДУ ДЛЯ ВІДПРАВКИ:');
    console.log(`NP_WAREHOUSE_SENDER_REF=${warehouseResponse.data[0].Ref}`);

  } catch (error) {
    console.error('❌ Помилка при отриманні інформації про склади:', error.message);
  }
}

getWarehouseInfo();