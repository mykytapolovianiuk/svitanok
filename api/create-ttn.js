import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

try {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
} catch (e) { /* Error handling in production */ }

// Хелпер для запитів до НП
async function novaPoshtaRequest(apiKey, model, method, props) {
  const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
    method: 'POST',
    body: JSON.stringify({
      apiKey,
      modelName: model,
      calledMethod: method,
      methodProperties: props
    })
  });
  const data = await response.json();
  return data;
}

import { getCorsHeaders, logCorsAttempt } from './utils/cors.js';

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  logCorsAttempt(origin, [
    'https://svitanok.com',
    'https://www.svitanok.com',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:5173', 'http://localhost:3000'] : [])
  ]);
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Production logging removed

    let body = req.body;
    if (typeof req.body === 'string') {
      try { body = JSON.parse(req.body); } catch (e) {}
    }
    const { orderId } = body;

    // 1. Init Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Get Order
    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
    // Production logging removed
    const delivery = order.delivery_info;
    // Production logging removed

    // Validate required fields
    if (!delivery) {
      throw new Error('Відсутня інформація про доставку');
    }
    
    if (!delivery.cityRef || delivery.cityRef.trim() === '') {
      throw new Error('Відсутній cityRef у інформації про доставку');
    }
    
    if (!delivery.warehouseRef || delivery.warehouseRef.trim() === '') {
      throw new Error('Відсутній warehouseRef у інформації про доставку');
    }

    // Log delivery info for debugging
    // Production logging removed

    // 3. Prepare Phone
    let rawPhone = order.customer_phone || delivery.phone || '';
    let cleanPhone = rawPhone.replace(/[^\d]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '38' + cleanPhone;
    if (cleanPhone.length === 9) cleanPhone = '380' + cleanPhone;

    // 4. Prepare Name (Split First/Last)
    const fullName = (order.customer_name || '').trim();
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'Клієнт';
    const lastName = nameParts.length > 1 ? nameParts[1] : 'Світанок';
    const middleName = nameParts.length > 2 ? nameParts[2] : '';

    // 5. Keys
    const apiKey = process.env.VITE_NOVA_POSHTA_API_KEY;
    const senderRef = process.env.NP_SENDER_REF || process.env.SENDER_REF;
    const senderCityRef = process.env.NP_CITY_SENDER_REF || process.env.SENDER_CITY_REF;
    const senderAddressRef = process.env.NP_ADDRESS_SENDER_REF || process.env.NP_WAREHOUSE_SENDER_REF || process.env.SENDER_ADDRESS_REF;
    const contactPersonRef = process.env.NP_CONTACT_PERSON_REF || process.env.NP_CONTACT_SENDER_REF || process.env.CONTACT_PERSON_REF;
    const sendersPhone = process.env.NP_SENDERS_PHONE || process.env.NP_SENDER_PHONE || process.env.SENDERS_PHONE;

    // Validate sender information
    if (!apiKey) {
      throw new Error('Відсутній API ключ Nova Poshta (VITE_NOVA_POSHTA_API_KEY)');
    }
    
    if (!senderRef || senderRef.trim() === '') {
      throw new Error('Відсутній референс відправника (NP_SENDER_REF або SENDER_REF)');
    }
    
    if (!senderCityRef || senderCityRef.trim() === '') {
      throw new Error('Відсутній референс міста відправника (NP_CITY_SENDER_REF або SENDER_CITY_REF)');
    }
    
    if (!senderAddressRef || senderAddressRef.trim() === '') {
      throw new Error('Відсутній референс адреси відправника (NP_ADDRESS_SENDER_REF або SENDER_ADDRESS_REF)');
    }
    
    if (!contactPersonRef || contactPersonRef.trim() === '') {
      throw new Error('Відсутній референс контактної особи (NP_CONTACT_PERSON_REF або CONTACT_PERSON_REF)');
    }
    
    if (!sendersPhone || sendersPhone.trim() === '') {
      throw new Error('Відсутній телефон відправника (NP_SENDERS_PHONE або SENDERS_PHONE)');
    }

    // Log sender info for debugging
    // Production logging removed

    // --- КРОК 1: СТВОРЮЄМО/ШУКАЄМО ОТРИМУВАЧА ---
    // Production logging removed
    // Production logging removed
    
    // Validate client data before sending
    if (!firstName || firstName.trim() === '') {
      throw new Error('Відсутнє ім\'я клієнта');
    }
    
    if (!cleanPhone || cleanPhone.trim() === '') {
      throw new Error('Відсутній телефон клієнта');
    }

    const recipientData = await novaPoshtaRequest(apiKey, 'Counterparty', 'save', {
      FirstName: firstName,
      LastName: lastName,
      MiddleName: middleName,
      Phone: cleanPhone,
      Email: order.customer_email || '',
      CounterpartyType: 'PrivatePerson',
      CounterpartyProperty: 'Recipient'
    });

    // Production logging removed

    if (!recipientData.success || !recipientData.data[0]) {
      throw new Error(`Не вдалося створити клієнта: ${recipientData.errors?.join(', ')}`);
    }

    // Validate recipient data structure
    const recipient = recipientData.data[0];
    if (!recipient.Ref) {
      throw new Error('Отримано некоректну відповідь від Nova Poshta: відсутній Ref клієнта');
    }

    if (!recipient.ContactPerson || !recipient.ContactPerson.data || !recipient.ContactPerson.data[0] || !recipient.ContactPerson.data[0].Ref) {
      throw new Error('Отримано некоректну відповідь від Nova Poshta: відсутній контакт клієнта');
    }

    const recipientRef = recipient.Ref;
    const recipientContactRef = recipient.ContactPerson.data[0].Ref;
    
    // Production logging removed

    // --- КРОК 2: СТВОРЮЄМО НАКЛАДНУ ---
    // Production logging removed

    // Final validation before TTN creation
    // Production logging removed

    const payload = {
      NewAddress: "0",
      PayerType: "Recipient", // Тепер можна ставити Recipient, бо клієнт існує
      PaymentMethod: "Cash",
      CargoType: "Parcel",
      VolumeGeneral: "0.0004",
      Weight: "1",
      ServiceType: "WarehouseWarehouse",
      SeatsAmount: "1",
      Description: "Svitanok",
      Cost: String(Math.max(200, Number(order.total_price) || 200)),
      DateTime: new Date().toISOString().split('T')[0].split('-').reverse().join('.'),
      
      // SENDER
      CitySender: senderCityRef,
      Sender: senderRef,
      SenderAddress: senderAddressRef,
      ContactSender: contactPersonRef,
      SendersPhone: sendersPhone,

      // RECIPIENT (Тепер використовуємо Ref, а не текст!)
      CityRecipient: delivery.cityRef, // Changed from RecipientCity to CityRecipient
      RecipientAddress: delivery.warehouseRef,
      Recipient: recipientRef, // 🔥 ОСЬ ЦЬОГО НЕ ВИСТАЧАЛО
      ContactRecipient: recipientContactRef, // 🔥 І ЦЬОГО
      RecipientsPhone: cleanPhone,
      
      // Додаємо OptionsSeat для виправлення помилки
      OptionsSeat: [{
        volumetricVolume: "0.0004",
        volumetricWidth: "10",
        volumetricLength: "10",
        volumetricHeight: "10",
        weight: "1",
        description: "Svitanok товар"
      }]
    };

    // Переконуємося, що числові значення мають правильний формат
    payload.VolumeGeneral = parseFloat(payload.VolumeGeneral).toFixed(4);
    payload.Weight = parseFloat(payload.Weight).toFixed(1);
    payload.Cost = Math.round(parseFloat(payload.Cost)).toString();
    
    if (payload.OptionsSeat && payload.OptionsSeat[0]) {
      const seat = payload.OptionsSeat[0];
      seat.volumetricVolume = parseFloat(seat.volumetricVolume).toFixed(4);
      seat.weight = parseFloat(seat.weight).toFixed(1);
      seat.volumetricWidth = parseFloat(seat.volumetricWidth).toFixed(0);
      seat.volumetricLength = parseFloat(seat.volumetricLength).toFixed(0);
      seat.volumetricHeight = parseFloat(seat.volumetricHeight).toFixed(0);
    }

    // Production logging removed

    // Validate payload before sending
    const requiredFields = [
      'CitySender', 'Sender', 'SenderAddress', 'ContactSender', 'SendersPhone',
      'CityRecipient', 'RecipientAddress', 'Recipient', 'ContactRecipient', 'RecipientsPhone'
    ];

    const missingFields = requiredFields.filter(field => !payload[field] || payload[field].trim() === '');
    if (missingFields.length > 0) {
      throw new Error(`Відсутні обов'язкові поля в запиті: ${missingFields.join(', ')}`);
    }
    
    // Validate OptionsSeat
    if (!payload.OptionsSeat || !Array.isArray(payload.OptionsSeat) || payload.OptionsSeat.length === 0) {
      throw new Error('Відсутні дані про місця (OptionsSeat)');
    }
    
    const seat = payload.OptionsSeat[0];
    const requiredSeatFields = ['volumetricVolume', 'volumetricWidth', 'volumetricLength', 'volumetricHeight', 'weight', 'description'];
    const missingSeatFields = requiredSeatFields.filter(field => !seat[field] || seat[field].toString().trim() === '');
    if (missingSeatFields.length > 0) {
      throw new Error(`Відсутні обов'язкові поля в OptionsSeat: ${missingSeatFields.join(', ')}`);
    }

    const ttnData = await novaPoshtaRequest(apiKey, 'InternetDocument', 'save', payload);
    // Production logging removed

    if (ttnData.success && ttnData.data[0]) {
      const ttn = ttnData.data[0].IntDocNumber;
      // Production logging removed

      await supabase.from('orders').update({ ttn, status: 'shipped' }).eq('id', orderId);
      return res.status(200).json({ success: true, ttn });
    } else {
      // Error handling in production
      return res.status(400).json({ 
        error: 'Помилка створення ТТН', 
        details: ttnData.errors,
        payload: payload // Include payload for debugging
      });
    }

  } catch (error) {
    // Error handling in production
    return res.status(500).json({ error: error.message });
  }
}