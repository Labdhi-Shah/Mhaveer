const fs = require('fs');
let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/Header.jsx';
let content = fs.readFileSync(file, 'utf8');

// Undo the wrapper text color change
content = content.replace('color: "text-[#FFFFFF]"', 'color: "text-slate-400"');

// Apply text-[#FFFFFF] directly to the spans for the completed label, so the icon isn't affected
content = content.replace(
  '<span className="font-mono tracking-widest hidden sm:inline">{widgetProps.label}</span>',
  '<span className="font-mono tracking-widest hidden sm:inline text-[#FFFFFF]">{widgetProps.label}</span>'
);

content = content.replace(
  '<span className="font-mono tracking-widest inline sm:hidden">{widgetProps.mobileLabel || widgetProps.label}</span>',
  '<span className="font-mono tracking-widest inline sm:hidden text-[#FFFFFF]">{widgetProps.mobileLabel || widgetProps.label}</span>'
);

fs.writeFileSync(file, content);
console.log("Updated text spans to white");
