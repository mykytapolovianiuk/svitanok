const fs = require('fs');
const path = require('path');

// Папки, которые будем чистить
const DIRS_TO_CLEAN = ['src', 'supabase'];

function cleanComments(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            cleanComments(fullPath);
        } else {
            cleanFile(fullPath);
        }
    }
}

function cleanFile(filePath) {
    const ext = path.extname(filePath);
    // Обрабатываем только нужные форматы
    if (!['.ts', '.tsx', '.js', '.jsx', '.sql'].includes(ext)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    if (ext === '.sql') {
        // Удаляем строчные SQL комментарии (--)
        content = content.replace(/^\s*--.*$/gm, '');
        // Удаляем блочные SQL комментарии (/* ... */)
        content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    } else {
        // Удаляем блочные комментарии /* ... */ (игнорируем /* eslint ... */)
        content = content.replace(/\/\*(?!\s*eslint)[\s\S]*?\*\//g, '');
        
        // Удаляем строчные комментарии // ...
        // (?<![:"']) - защита от удаления ссылок типа https://
        // (?!\s*eslint|\s*@ts|\s*@vite) - защита от важных системных директив
        content = content.replace(/(?<![:"'])\/\/(?!\s*eslint|\s*@ts|\s*@vite).*$/gm, '');
    }

    // Убираем лишние пустые строки, оставшиеся после удаления
    content = content.replace(/^\s*[\r\n]/gm, '');

    // Записываем только если были изменения
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

console.log('🧹 Начинаем зачистку проекта от комментариев...');
DIRS_TO_CLEAN.forEach(dir => {
    if (fs.existsSync(dir)) {
        cleanComments(dir);
    } else {
        console.log(`⚠️ Папка ${dir} не найдена, пропускаем.`);
    }
});
console.log('✅ Очистка завершена! Проект чист.');
