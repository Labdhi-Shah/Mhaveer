const fs = require('fs');

let file1 = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/NewLeadView.jsx';
let content1 = fs.readFileSync(file1, 'utf8');
content1 = content1.replace(
    '<label className={labelClass}>M.V</label>',
    '<label className={labelClass}>Property Market Value</label>'
);
content1 = content1.replace(
    '<label className={labelClass}>M.V</label>',
    '<label className={labelClass}>Property Market Value</label>'
);
fs.writeFileSync(file1, content1);

let file2 = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/FillFormModal.jsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(
    /<label className="text-\[13px\] font-semibold text-slate-700 mb-1\.5 block">M\.V<\/label>/g,
    '<label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Property Market Value</label>'
);
content2 = content2.replace(
    /<label className="block text-\[13px\] font-semibold text-slate-700 mb-1\.5">M\.V<\/label>/g,
    '<label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Market Value</label>'
);
fs.writeFileSync(file2, content2);
console.log('Fixed M.V labels');
