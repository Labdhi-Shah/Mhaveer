const fs = require('fs');

let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/Header.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace notification dot background
content = content.replace('bg-[#9ca3af] rounded-full', 'bg-white rounded-full');

// Replace avatar background
content = content.replace('bg-[#9ca3af] text-[#162335] flex items-center justify-center font-black', 'bg-white text-[#162335] flex items-center justify-center font-black');

fs.writeFileSync(file, content);
console.log("Updated Header.jsx");
