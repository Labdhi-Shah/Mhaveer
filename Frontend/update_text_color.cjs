const fs = require('fs');
let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/Header.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('color: "text-slate-400"', 'color: "text-[#FFFFFF]"');

fs.writeFileSync(file, content);
console.log("Updated text color");
