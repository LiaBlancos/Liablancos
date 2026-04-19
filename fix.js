const fs = require('fs');
const p = 'src/app/muhasebe/gider-kaydi/page.tsx';
let content = fs.readFileSync(p, 'utf8');
content = content.replace(/<\/h2>[\s\S]*?<p className=/g, '</h2>\n          <p className=');
fs.writeFileSync(p, content, 'utf8');
console.log('Fixed');
