const fs = require('fs');
let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/Header.jsx';
let content = fs.readFileSync(file, 'utf8');

// Remove the text-[#FFFFFF] from the spans
content = content.replace(
  '<span className="font-mono tracking-widest hidden sm:inline text-[#FFFFFF]">{widgetProps.label}</span>',
  '<span className="font-mono tracking-widest hidden sm:inline">{widgetProps.label}</span>'
);

content = content.replace(
  '<span className="font-mono tracking-widest inline sm:hidden text-[#FFFFFF]">{widgetProps.mobileLabel || widgetProps.label}</span>',
  '<span className="font-mono tracking-widest inline sm:hidden">{widgetProps.mobileLabel || widgetProps.label}</span>'
);

fs.writeFileSync(file, content);
console.log("Restored text spans to original color");
