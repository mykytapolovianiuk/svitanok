import fetch from 'node-fetch'; // Якщо помилка, видали цей рядок (для node 18+)

const API_KEY = '6e5d454d862f50c90eb47c8e76af5353'; // Твій новий ключ
const SENDER_LASTNAME = 'Кулинич';
const CITY_NAME = 'Суми';
const WAREHOUSE_NUM = '2';

async function getKeys() {
  console.log('🔄 Шукаю дані для м. Суми та ФОП Кулинич...');

  // 1. Шукаємо Відправника (Контрагента)
  const senderRes = await fetch('https://api.novaposhta.ua/v2.0/json/', {
    method: 'POST',
    body: JSON.stringify({
      apiKey: API_KEY,
      modelName: 'Counterparty',
      calledMethod: 'getCounterparties',
      methodProperties: { CounterpartyProperty: 'Sender', Page: 1 }
    })
  }).then(r => r.json());

  // Шукаємо за прізвищем
  const sender = senderRes.data.find(s => s.Description.includes(SENDER_LASTNAME));
  
  if (!sender) {
      console.error('❌ Відправника "Кулинич" не знайдено. Перевірте, чи створено його в бізнес-кабінеті НП.');
      return;
  }
  console.log(`✅ Знайдено відправника: ${sender.Description}`);

  // 2. Шукаємо Контактну особу
  const contactRes = await fetch('https://api.novaposhta.ua/v2.0/json/', {
    method: 'POST',
    body: JSON.stringify({
      apiKey: API_KEY,
      modelName: 'Counterparty',
      calledMethod: 'getCounterpartyContactPersons',
      methodProperties: { Ref: sender.Ref }
    })
  }).then(r => r.json());
  
  const contact = contactRes.data[0];

  // 3. Шукаємо Місто (Суми)
  const cityRes = await fetch('https://api.novaposhta.ua/v2.0/json/', {
    method: 'POST',
    body: JSON.stringify({
      apiKey: API_KEY,
      modelName: 'Address',
      calledMethod: 'searchSettlements',
      methodProperties: { CityName: CITY_NAME, Limit: 5 }
    })
  }).then(r => r.json());

  const city = cityRes.data[0]?.Addresses[0];
  console.log(`✅ Знайдено місто: ${city.MainDescription}`);

  // 4. Шукаємо Склад №2
  const warehouseRes = await fetch('https://api.novaposhta.ua/v2.0/json/', {
    method: 'POST',
    body: JSON.stringify({
      apiKey: API_KEY,
      modelName: 'Address',
      calledMethod: 'getWarehouses',
      methodProperties: { CityRef: city.DeliveryCity }
    })
  }).then(r => r.json());

  const warehouse = warehouseRes.data.find(w => w.Number === WAREHOUSE_NUM);
  console.log(`✅ Знайдено склад: ${warehouse.Description}`);

  console.log('\n=== КОПІЮЙ ЦЕ В .env.local ===');
  console.log(`NP_SENDER_REF=${sender.Ref}`);
  console.log(`NP_CONTACT_SENDER_REF=${contact.Ref}`);
  console.log(`NP_SENDER_PHONE=${contact.Phones}`);
  console.log(`NP_CITY_SENDER_REF=${city.DeliveryCity}`);
  console.log(`NP_WAREHOUSE_SENDER_REF=${warehouse.Ref}`);
}

getKeys();