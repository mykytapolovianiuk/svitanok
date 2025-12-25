

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://svitanok.com';
const SITE_NAME = 'Svitanok';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalPrice: number;
  deliveryMethod: string;
  deliveryInfo?: {
    city?: string;
    warehouse?: string;
    address?: string;
  };
  paymentMethod: string;
  orderDate: string;
}


export async function sendOrderConfirmation(orderData: OrderData): Promise<boolean> {
  try {
    const html = generateOrderConfirmationHTML(orderData);
    
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: orderData.customerEmail,
        subject: `Підтвердження замовлення #${orderData.orderId}`,
        html,
        type: 'order_confirmation',
        orderData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Email] Failed to send order confirmation:', error);
      return false;
    }

    
    return true;
  } catch (error) {
    console.error('[Email] Error sending order confirmation:', error);
    return false;
  }
}


export async function sendOrderStatusUpdate(
  email: string,
  orderId: string,
  status: string,
  ttn?: string
): Promise<boolean> {
  try {
    const statusText = getStatusText(status);
    const html = generateStatusUpdateHTML(orderId, statusText, ttn);
    
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: `Оновлення статусу замовлення #${orderId}`,
        html,
        type: 'status_update',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Email] Failed to send status update:', error);
      return false;
    }

    
    return true;
  } catch (error) {
    console.error('[Email] Error sending status update:', error);
    return false;
  }
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Нове',
    'processing': 'В обробці',
    'shipped': 'Відправлене',
    'delivered': 'Доставлене',
    'cancelled': 'Скасоване',
  };
  return statusMap[status] || status;
}

function generateOrderConfirmationHTML(orderData: OrderData): string {
  const itemsHTML = orderData.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(item.name)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price)}</td>
    </tr>
  `).join('');

  const deliveryInfo = orderData.deliveryInfo
    ? `
      <p><strong>Місто:</strong> ${escapeHtml(orderData.deliveryInfo.city || '')}</p>
      ${orderData.deliveryInfo.warehouse ? `<p><strong>Відділення:</strong> ${escapeHtml(orderData.deliveryInfo.warehouse)}</p>` : ''}
      ${orderData.deliveryInfo.address ? `<p><strong>Адреса:</strong> ${escapeHtml(orderData.deliveryInfo.address)}</p>` : ''}
    `
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Підтвердження замовлення</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #000; color: #fff; padding: 20px; text-align: center;">
    <h1 style="margin: 0;">${SITE_NAME}</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; margin-top: 20px;">
    <h2 style="color: #000; margin-top: 0;">Дякуємо за ваше замовлення!</h2>
    
    <p>Шановний(а) <strong>${escapeHtml(orderData.customerName)}</strong>,</p>
    
    <p>Ваше замовлення <strong>#${orderData.orderId}</strong> успішно прийнято та буде оброблено найближчим часом.</p>
    
    <h3 style="color: #000; margin-top: 30px;">Деталі замовлення:</h3>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #f0f0f0;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #000;">Товар</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #000;">Кількість</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #000;">Ціна</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #000;">Всього:</td>
          <td style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #000;">${formatPrice(orderData.totalPrice)}</td>
        </tr>
      </tfoot>
    </table>
    
    <div style="margin-top: 30px; padding: 20px; background: #fff; border: 1px solid #ddd;">
      <h3 style="color: #000; margin-top: 0;">Інформація про доставку:</h3>
      <p><strong>Спосіб доставки:</strong> ${escapeHtml(orderData.deliveryMethod)}</p>
      ${deliveryInfo}
      <p><strong>Спосіб оплати:</strong> ${escapeHtml(orderData.paymentMethod)}</p>
      <p><strong>Дата замовлення:</strong> ${formatDate(orderData.orderDate)}</p>
    </div>
    
    <p style="margin-top: 30px;">Ми зв'яжемося з вами найближчим часом для підтвердження замовлення.</p>
    
    <p>З повагою,<br><strong>Команда ${SITE_NAME}</strong></p>
    
    <div style="margin-top: 30px; padding: 20px; background: #f0f0f0; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #666;">
        Якщо у вас виникли питання, зв'яжіться з нами:<br>
        <a href="${SITE_URL}/contacts" style="color: #000;">${SITE_URL}/contacts</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateStatusUpdateHTML(orderId: string, statusText: string, ttn?: string): string {
  const ttnInfo = ttn ? `<p><strong>Номер ТТН:</strong> ${escapeHtml(ttn)}</p>` : '';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Оновлення статусу замовлення</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #000; color: #fff; padding: 20px; text-align: center;">
    <h1 style="margin: 0;">${SITE_NAME}</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; margin-top: 20px;">
    <h2 style="color: #000; margin-top: 0;">Оновлення статусу замовлення</h2>
    
    <p>Статус вашого замовлення <strong>#${orderId}</strong> оновлено:</p>
    
    <div style="margin: 20px 0; padding: 20px; background: #fff; border-left: 4px solid #000;">
      <h3 style="margin: 0; color: #000;">${escapeHtml(statusText)}</h3>
      ${ttnInfo}
    </div>
    
    <p>Ви можете відстежити статус вашого замовлення в <a href="${SITE_URL}/account" style="color: #000;">особистому кабінеті</a>.</p>
    
    <p>З повагою,<br><strong>Команда ${SITE_NAME}</strong></p>
  </div>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
  }).format(price);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('uk-UA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

