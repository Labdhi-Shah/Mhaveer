const fs = require('fs');
let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/Header.jsx';
let content = fs.readFileSync(file, 'utf8');

// Reset to previous state just in case my replace failed
content = content.replace(/style=\{\{ backgroundColor: "#FFFFFF" \}\}/g, '');

// Header border
content = content.replace('border-b-2 border-[#9ca3af]', 'border-b-2 border-[#FFFFFF]');

// Vertical dividers
content = content.replace(/bg-slate-700/g, 'bg-[#FFFFFF]');

// Completed button background and border
content = content.replace('bg-slate-800/40 border-slate-700', 'bg-[#FFFFFF] border-[#FFFFFF]');
// In case it was already replaced
content = content.replace('bg-slate-800/40 border-[#FFFFFF]', 'bg-[#FFFFFF] border-[#FFFFFF]');

// Re-apply bg-white properly as bg-[#FFFFFF]
content = content.replace(/bg-white rounded-full/g, 'bg-[#FFFFFF] rounded-full');
content = content.replace(/bg-white text-\[#162335\]/g, 'bg-[#FFFFFF] text-[#162335]');

fs.writeFileSync(file, content);
console.log("Updated Header.jsx securely");
