const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const DARK_BLUE = '#162335';
const WHITE = '#ffffff';

function replaceColors(content) {
  // Regex patterns to match utility classes
  const patterns = [
    // bg colors
    /bg-([a-z]+)-(\d+)(\/\d+)?/g,
    /bg-white\b/g, // keep white but handle any custom
    /bg-black\b/g,
    /bg-\[([^\]]+)\]/g,
    
    // text colors
    /text-([a-z]+)-(\d+)(\/\d+)?/g,
    /text-black\b/g,
    /text-\[([^\]]+)\]/g,

    // border colors
    /border-([a-z]+)-(\d+)(\/\d+)?/g,
    /border-black\b/g,
    /border-\[([^\]]+)\]/g,
    
    // inline style colors
    /color:\s*["']([^"']+)["']/gi,
    /background:\s*["']([^"']+)["']/gi,
    /backgroundColor:\s*["']([^"']+)["']/gi,
    /borderColor:\s*["']([^"']+)["']/gi,
    /fill=["']([^"']+)["']/gi,
    /stroke=["']([^"']+)["']/gi,
  ];

  let newContent = content;

  // Manual safe replacements for standard tailwind colors
  // Replace dark backgrounds/texts with white, light with dark blue, or just make everything fit 2 colors.
  
  // Replace specific tailwind prefixes
  // e.g. text-slate-500 -> text-[#162335]
  const textReplace = [
    { regex: /text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[1-4]00(\/\d+)?/g, replacement: `text-[${DARK_BLUE}]` },
    { regex: /text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[5-9]00(\/\d+)?/g, replacement: `text-[${DARK_BLUE}]` },
    { regex: /text-black(\/\d+)?/g, replacement: `text-[${DARK_BLUE}]` }
  ];
  
  const bgReplace = [
    // Light backgrounds -> white
    { regex: /bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[1-3]00(\/\d+)?/g, replacement: 'bg-white' },
    // Dark backgrounds -> dark blue
    { regex: /bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[4-9]00(\/\d+)?/g, replacement: `bg-[${DARK_BLUE}]` },
    { regex: /bg-black(\/\d+)?/g, replacement: `bg-[${DARK_BLUE}]` }
  ];

  const borderReplace = [
    { regex: /border-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[1-3]00(\/\d+)?/g, replacement: 'border-white' },
    { regex: /border-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[4-9]00(\/\d+)?/g, replacement: `border-[${DARK_BLUE}]` },
    { regex: /border-black(\/\d+)?/g, replacement: `border-[${DARK_BLUE}]` }
  ];

  for (const { regex, replacement } of textReplace) {
    newContent = newContent.replace(regex, replacement);
  }
  for (const { regex, replacement } of bgReplace) {
    newContent = newContent.replace(regex, replacement);
  }
  for (const { regex, replacement } of borderReplace) {
    newContent = newContent.replace(regex, replacement);
  }
  
  // Custom hex color replacements
  // Inline styles and arbitrary values like bg-[#d4af37]
  const customHexRegex = /bg-\[\#([a-fA-F0-9]{3,6})\]/g;
  newContent = newContent.replace(customHexRegex, (match, hex) => {
    if (hex.toLowerCase() === '162335' || hex.toLowerCase() === 'ffffff' || hex.toLowerCase() === 'fff') return match;
    // all other bg -> dark blue
    return `bg-[${DARK_BLUE}]`;
  });

  const customTextRegex = /text-\[\#([a-fA-F0-9]{3,6})\]/g;
  newContent = newContent.replace(customTextRegex, (match, hex) => {
    if (hex.toLowerCase() === '162335' || hex.toLowerCase() === 'ffffff' || hex.toLowerCase() === 'fff') return match;
    return `text-[${DARK_BLUE}]`;
  });

  const customBorderRegex = /border-\[\#([a-fA-F0-9]{3,6})\]/g;
  newContent = newContent.replace(customBorderRegex, (match, hex) => {
    if (hex.toLowerCase() === '162335' || hex.toLowerCase() === 'ffffff' || hex.toLowerCase() === 'fff') return match;
    return `border-[${DARK_BLUE}]`;
  });

  // Inline style colors
  const inlineColorRegex = /(color|background|backgroundColor|borderColor|fill|stroke):\s*["']([^"']+)["']/gi;
  newContent = newContent.replace(inlineColorRegex, (match, prop, colorVal) => {
    if (colorVal === 'transparent' || colorVal === 'none') return match;
    let color = colorVal.toLowerCase();
    if (color.includes('#162335') || color.includes('#ffffff') || color.includes('#fff') || color.includes('white')) {
      return match; // Keep existing if valid
    }
    
    // Determine whether to replace with white or dark blue
    // If it's a light background -> white
    // If it's a dark color -> dark blue
    // For simplicity, just set all text to dark blue and all bg to white (or dark blue if it was dark).
    // Actually, setting all non-white/dark blue text/borders/strokes to dark blue:
    if (prop.toLowerCase() === 'color' || prop.toLowerCase() === 'stroke' || prop.toLowerCase() === 'fill' || prop.toLowerCase() === 'bordercolor') {
       // if it was white, keep white
       return `${prop}: "${DARK_BLUE}"`;
    }
    if (prop.toLowerCase() === 'background' || prop.toLowerCase() === 'backgroundcolor') {
       // if it's #f0f4f8 or similar, replace with white
       return `${prop}: "white"`;
    }
    
    return match;
  });

  return newContent;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const newContent = replaceColors(content);
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Done!');
