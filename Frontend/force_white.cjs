const fs = require('fs');
let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/Header.jsx';
let content = fs.readFileSync(file, 'utf8');

// Header border
content = content.replace('border-b-2 border-[#9ca3af]', 'border-b-2 border-[#FFFFFF]');

// Vertical dividers
content = content.replace(/bg-slate-700/g, 'bg-[#FFFFFF]');

// Completed button background and border
content = content.replace('bg-slate-800/40 border-slate-700', 'bg-[#FFFFFF] border-[#FFFFFF]');
content = content.replace('bg-slate-800/40 border-[#FFFFFF]', 'bg-[#FFFFFF] border-[#FFFFFF]');

// Avatar and dot (add explicit style just in case)
content = content.replace('bg-white rounded-full', 'bg-[#FFFFFF] rounded-full" style={{ backgroundColor: "#FFFFFF" }}');
content = content.replace('bg-white text-[#162335]', 'bg-[#FFFFFF] text-[#162335]" style={{ backgroundColor: "#FFFFFF" }}');

fs.writeFileSync(file, content);
console.log("Updated Header.jsx with #FFFFFF");
