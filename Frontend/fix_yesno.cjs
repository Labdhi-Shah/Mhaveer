const fs = require('fs');

let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/FillFormModal.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /<div className="flex items-center gap-2 mt-7">\s*<input type="checkbox" id="naPlotYesNoModal"[\s\S]*?<\/label>\s*<\/div>/;
const regex2 = /<div className="flex items-center gap-2 mt-7">\s*<input type="checkbox" id="unsoldYesNoModal"[\s\S]*?<\/label>\s*<\/div>/;

if (regex1.test(content)) {
    content = content.replace(regex1, '<div className="hidden">\n                                    <input type="checkbox" id="naPlotYesNoModal" checked={naPlotYesNo} onChange={(e) => setNaPlotYesNo(e.target.checked)} />\n                                  </div>');
    console.log('Fixed naPlotYesNoModal');
}
if (regex2.test(content)) {
    content = content.replace(regex2, '<div className="hidden">\n                                    <input type="checkbox" id="unsoldYesNoModal" checked={unsoldYesNo} onChange={(e) => setUnsoldYesNo(e.target.checked)} />\n                                  </div>');
    console.log('Fixed unsoldYesNoModal');
}

fs.writeFileSync(file, content);
