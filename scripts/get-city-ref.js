import fetch from 'node-fetch';

const API_KEY = '6e5d454d862f50c90eb47c8e76af5353'; 

async function getCityRef() {
  console.log('🔄 Отримую список міст...');

  try {
    
    const cityResponse = await fetch('https://api.novaposhta.ua/v2.0/json/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: API_KEY,
        modelName: 'Address',
        calledMethod: 'getCities',
        methodProperties: { 
          Page: 1 
        }
      })
    }).then(r => r.json());

    if (!cityResponse.success || cityResponse.data.length === 0) {
      console.error('❌ Помилка: Не вдалося отримати список міст.');
      return;
    }

    console.log('\n🏙️ Перші 10 міст:');
    cityResponse.data.slice(0, 10).forEach((city, index) => {
      console.log(`${index + 1}. ${city.Description} (Ref: ${city.Ref})`);
    });

  } catch (error) {
    console.error('❌ Помилка при отриманні списку міст:', error.message);
  }
}

getCityRef();