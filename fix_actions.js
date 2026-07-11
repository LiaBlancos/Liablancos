const fs = require('fs');
const buf = fs.readFileSync('src/lib/actions.ts');
// Find the index of "revalidatePath('/ayarlar/kategori-ve-etiketler')"
const str = buf.toString('latin1');
const marker = "revalidatePath('/ayarlar/kategori-ve-etiketler')";
const idx = str.lastIndexOf(marker);
if (idx > -1) {
    // Find the end of that function
    const endIdx = str.indexOf('}', idx);
    if (endIdx > -1) {
        const correctBuf = buf.slice(0, endIdx + 1);
        fs.writeFileSync('src/lib/actions.ts', correctBuf);
        console.log("Fixed corrupted actions.ts file!");
    } else {
        console.log("Could not find closing brace.");
    }
} else {
    console.log("Marker not found.");
}
