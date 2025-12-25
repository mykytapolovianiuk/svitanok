import fetch from 'node-fetch'; 


const API_KEY = '6e5d454d862f50c90eb47c8e76af5353'; 

async function getData() {
  console.log('🔄 Отримую дані відправника...');

  
  const senderResponse = await fetch('https://api.novaposhta.ua/v2.0/json/', {
    method: 'POST',
    body: JSON.stringify({
      apiKey: API_KEY,
      modelName: 'Counterparty',
      calledMethod: 'getCounterparties',
      methodProperties: { CounterpartyProperty: 'Sender', Page: 1 }
    })
  }).then(r => r.json());

  if (!senderResponse.success || senderResponse.data.length === 0) {
    console.error('❌ Помилка: Не знайдено відправника. Створіть відправника в кабінеті НП.');
    return;
  }

  const sender = senderResponse.data[0];
  console.log('\n✅ ВАШ SENDER_REF (Вставте в .env):');
  console.log(`NP_SENDER_REF=${sender.Ref}`);
  console.log(`NP_CITY_SENDER_REF=${sender.City}`); 

  
  const contactResponse = await fetch('https://api.novaposhta.ua/v2.0/json/', {
    method: 'POST',
    body: JSON.stringify({
      apiKey: API_KEY,
      modelName: 'Counterparty',
      calledMethod: 'getCounterpartyContactPersons',
      methodProperties: { Ref: sender.Ref, Page: 1 }
    })
  }).then(r => r.json());

  const contact = contactResponse.data[0];
  console.log('\n✅ ВАШ CONTACT_PERSON_REF (Вставте в .env):');
  console.log(`NP_CONTACT_SENDER_REF=${contact.Ref}`);
  console.log(`NP_SENDER_PHONE=${contact.Phones}`);

  
  const warehouseResponse = await fetch('https://api.novaposhta.ua/v2.0/json/', {
    method: 'POST',
    body: JSON.stringify({
      apiKey: API_KEY,
      modelName: 'Address',
      calledMethod: 'getWarehouses',
      methodProperties: { CityRef: sender.City, Page: 1 }
    })
  }).then(r => r.json());

  console.log('\n📦 ПРИКЛАД СКЛАДУ ВІДПРАВКИ (Якщо треба):');
  console.log(`NP_WAREHOUSE_SENDER_REF=${warehouseResponse.data[0].Ref}  (${warehouseResponse.data[0].Description})`);
}

getData();