const fs = require('fs');

function removeAsterisks(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove * from labels
    content = content.replace(/<label([^>]*)>(.*?)\s*\*\s*<\/label>/g, '<label$1>$2</label>');
    
    // Remove * from placeholders (e.g. placeholder="Age *")
    content = content.replace(/placeholder=\"(.*?)\s*\*(.*?)\"/g, 'placeholder=\"$1$2\"');
    
    // Remove * from raw text between tags (e.g. > Age * <)
    content = content.replace(/>\s*([A-Za-z0-9_ \(\)\/\-]+?)\s*\*\s*</g, '>$1<');
    
    fs.writeFileSync(filePath, content);
    console.log('Cleaned ' + filePath);
}

removeAsterisks('c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/FillFormModal.jsx');
removeAsterisks('c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/NewLeadView.jsx');
