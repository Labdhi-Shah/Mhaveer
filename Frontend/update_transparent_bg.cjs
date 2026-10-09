const fs = require('fs');
let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/Header.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('bg: "bg-[#FFFFFF] border-[#FFFFFF]",', 'bg: "bg-transparent border-slate-700",');

fs.writeFileSync(file, content);
console.log("Updated background to transparent");
