import fs from 'fs';
import { translate as bingTranslate } from 'bing-translate-api';
import { translate as googleTranslate } from '@vitalets/google-translate-api';

const CACHE_FILE = './translation_cache.json';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fixCache() {
    if (!fs.existsSync(CACHE_FILE)) return;
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    const missingKeys = Object.keys(cache).filter(k => cache[k] === k && k.match(/[а-яА-ЯЁё]/));

    console.log(`Найдено ${missingKeys.length} непереведенных строк. Переводим...`);

    // Отделяем короткие строки (до 800 симв) от длинных
    const shortTexts = missingKeys.filter(k => k.length <= 800);
    const longTexts = missingKeys.filter(k => k.length > 800);

    console.log(`Коротких: ${shortTexts.length}, Длинных: ${longTexts.length}`);

    // Батчим короткие
    const CHUNK_SIZE = 15;
    for (let i = 0; i < shortTexts.length; i += CHUNK_SIZE) {
        const chunk = shortTexts.slice(i, i + CHUNK_SIZE);
        console.log(`Батч коротких [${i + 1} - ${Math.min(i + CHUNK_SIZE, shortTexts.length)}] из ${shortTexts.length}...`);

        const combinedText = chunk.join(' ||| ');
        try {
            const res = await bingTranslate(combinedText, null, 'uk');
            const translatedParts = res.translation.split(/\|\|\||\|\||\| \| \|/).map(s => s.trim());

            for (let j = 0; j < chunk.length; j++) {
                const orig = chunk[j];
                cache[orig] = translatedParts[j] || orig;
            }
            fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
            await sleep(100);
        } catch (err) {
            console.error('   ⚠️ Ошибка перевода батча.', err.message);
            await sleep(1000);
        }
    }

    // Переводим длинные по одному, разбивая на куски
    for (let i = 0; i < longTexts.length; i++) {
        const text = longTexts[i];
        console.log(`[${i + 1}/${longTexts.length}] Длинный текст (${text.length} симв)...`);

        try {
            try {
                const res = await googleTranslate(text, { to: 'uk' });
                cache[text] = res.text;
            } catch (e) {
                console.log("   Google error, fallback to Bing chunking");

                // Умное разбиение по абзацам или предложениям
                let chunks = text.split(/\n+/);
                if (chunks.some(c => c.length > 900)) {
                    chunks = text.match(/[^.!?]+[.!?]+[\])'"`’”]*|.+/g) || [text];
                }

                let translatedChunks = [];
                for (let chunk of chunks) {
                    chunk = chunk.trim();
                    if (!chunk) continue;

                    // Если даже предложение слишком длинное, режем жестко
                    if (chunk.length > 950) {
                        const miniChunks = chunk.match(/.{1,900}(\s|$)/g) || [chunk];
                        for (const mc of miniChunks) {
                            try {
                                const r = await bingTranslate(mc, null, 'uk');
                                translatedChunks.push((r?.translation || mc) + ' ');
                            } catch (err) {
                                translatedChunks.push(mc + ' ');
                            }
                            await sleep(300);
                        }
                        continue;
                    }

                    try {
                        const r = await bingTranslate(chunk, null, 'uk');
                        // Добавляем пробел или перенос строки после
                        let sep = text.includes(chunk + '\n') ? '\n' : ' ';
                        translatedChunks.push((r?.translation || chunk) + sep);
                    } catch (err) {
                        console.error('   ⚠️ Ошибка Bing chunk:', err.message);
                        translatedChunks.push(chunk + ' ');
                    }
                    await sleep(500);
                }
                cache[text] = translatedChunks.join('').trim();
            }

            fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
            await sleep(500);
        } catch (e) {
            console.error("Ошибка перевода длинной строки:", String(e.message));
        }
    }

    console.log("Готово!");
}

fixCache();
