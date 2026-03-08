import { config } from 'dotenv';
config({ path: '.env.local' });

// You can temporarily hardcode your bot token here if it's not in .env.local yet
const botToken = process.env.TELEGRAM_BOT_TOKEN || '8060080341:AAF3nyXynucUNQhHVm8qYznQ-GnubgPrtNQ';

console.log('Перевірка токена бота:', botToken.split(':')[0] + ':***');

async function checkTelegramUpdates() {
    try {
        // 1. Проверяем информацию о самом боте (работает ли токен)
        const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const meData = await meRes.json();

        if (!meData.ok) {
            console.error('❌ Помилка токена бота:', meData.description);
            return;
        }
        console.log('✅ Бот підключений успішно!');
        console.log(`Ім'я бота: ${meData.result.first_name} (@${meData.result.username})`);
        console.log('-----------------------------------');

        // 2. Отримуємо останні оновлення (повідомлення в групах, куди додано бота)
        console.log('Отримання останніх повідомлень для пошуку Chat ID...');
        const updatesRes = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
        const updatesData = await updatesRes.json();

        if (!updatesData.ok) {
            console.error('❌ Помилка отримання оновлень:', updatesData.description);
            return;
        }

        if (updatesData.result.length === 0) {
            console.log('⚠️ Бот не має нових повідомлень.');
            console.log('➡️ Щоб побачити Chat ID:');
            console.log('   1. Додайте бота у вашу групу Telegram.');
            console.log('   2. Напишіть у групу будь-яке повідомлення (наприклад, "test").');
            console.log('   3. Запустіть цей скрипт ще раз.');
            return;
        }

        const chats = new Map();

        // Перебираємо всі повідомлення і збираємо унікальні чати
        updatesData.result.forEach(update => {
            let chat = null;
            if (update.message) chat = update.message.chat;
            else if (update.my_chat_member) chat = update.my_chat_member.chat;
            else if (update.channel_post) chat = update.channel_post.chat;

            if (chat && !chats.has(chat.id)) {
                chats.set(chat.id, chat);
            }
        });

        console.log(`✅ Знайдено ${chats.size} чатів/груп:`);
        chats.forEach((chat, id) => {
            console.log(`- Назва: "${chat.title || chat.first_name || 'Приватний чат'}"`);
            console.log(`  Тип: ${chat.type}`);
            console.log(`  АЙДІ (TELEGRAM_CHAT_ID): ${id}`);
            console.log('');
        });

        console.log('💡 Скопіюйте потрібний АЙДІ (включно з мінусом, якщо це група) і додайте його в Supabase Secrets.');

    } catch (error) {
        console.error('❌ Помилка з\'єднання:', error.message);
    }
}

checkTelegramUpdates();
