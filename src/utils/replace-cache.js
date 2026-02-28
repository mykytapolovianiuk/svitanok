import fs from 'fs';
const CACHE_FILE = './translation_cache.json';
const XML_FILE = './dr-spiller-ukr.xml';

if (!fs.existsSync(CACHE_FILE) || !fs.existsSync(XML_FILE)) process.exit(1);

const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
let xml = fs.readFileSync(XML_FILE, 'utf8');

// Sort cache keys by length descending to prevent partial replacements (e.g. replacing "Суха" before "Суха шкіра")
const keys = Object.keys(cache).sort((a, b) => b.length - a.length);

console.log('Replacing keys using cache...');

let replaceCount = 0;
for (const key of keys) {
    const trans = cache[key];
    if (!trans || trans === key || !key.match(/[а-яА-ЯёЁ]/)) continue; // Skip if untranslated or not Russian

    // Create safe replacement strings for standard text and CDATA
    const cdataKey = '<![CDATA[' + key + ']]>';
    const cdataTrans = '<![CDATA[' + trans + ']]>';

    const escapeXml = (unsafe) => String(unsafe).replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;'; case '>': return '&gt;';
            case '&': return '&amp;'; case '\'': return '&apos;';
            case '"': return '&quot;'; default: return c;
        }
    });

    const escapedKey = escapeXml(key);
    const escapedTrans = escapeXml(trans);

    // Quick check if present to optimize
    if (xml.includes(cdataKey)) {
        xml = xml.split(cdataKey).join(cdataTrans);
        replaceCount++;
    }

    if (xml.includes(escapedKey)) {
        xml = xml.split(escapedKey).join(escapedTrans);
        replaceCount++;
    }

    if (xml.includes(key)) {
        xml = xml.split(key).join(trans);
        replaceCount++;
    }
}

fs.writeFileSync('./dr-spiller-ukr-fixed.xml', xml, 'utf8');
console.log('Replaced ' + replaceCount + ' instances!');
