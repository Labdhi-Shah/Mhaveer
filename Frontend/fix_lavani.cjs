const fs = require('fs');

let file1 = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/NewLeadView.jsx';
let content1 = fs.readFileSync(file1, 'utf8');

const lavaniRe1 = /<div>\s*<label className=\{labelClass\}>Lavani<\/label>[\s\S]*?<\/div>/g;
content1 = content1.replace(lavaniRe1, '<div className="hidden">\n                  <input type="text" defaultValue="N/A" {...register("naPlotLavani")} />\n                </div>');

fs.writeFileSync(file1, content1);

let file2 = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/FillFormModal.jsx';
let content2 = fs.readFileSync(file2, 'utf8');

const lavaniRe2 = /<div>\s*<label className="[^"]*">Lavani<\/label>[\s\S]*?<\/div>/g;
content2 = content2.replace(lavaniRe2, '<div className="hidden">\n                                    <input type="text" value={naPlotLavani} onChange={(e) => setNaPlotLavani(e.target.value)} />\n                                  </div>');

fs.writeFileSync(file2, content2);
console.log('Fixed Lavani');
