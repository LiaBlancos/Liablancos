const fs = require('fs');
let buf = fs.readFileSync('src/lib/actions.ts', 'utf8');
const search = /revalidatePath\('\/ayarlar\/kategori-ve-etiketler'\)[\s\S]*?\/\/ --- INCOMES/m;
const replace = `revalidatePath('/ayarlar/kategori-ve-etiketler');\n    return { success: true };\n}\n\n// --- INCOMES`;
buf = buf.replace(search, replace);
fs.writeFileSync('src/lib/actions.ts', buf, 'utf8');
console.log('Fixed actions.ts');
