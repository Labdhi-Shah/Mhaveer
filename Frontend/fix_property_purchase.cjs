const fs = require('fs');

function updateFile(file) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // 1. Property Purchase Loan -> Category (Dastavej -> Document List)
    // Only in Property Purchase Loan section! But wait, Dastavej is used elsewhere too.
    // The user said: "Property Purchase Loan -> Category: Wherever the label “Dastavej” appears within the Category section, change it to “Document List”."
    // Wait, earlier I checked and `Dastavej Rate` and `Dastavej Name` are the only ones left in Property Purchase!
    // But there are also `unsoldDastavej`, `lrdDastavej`, `naPlotDastavej`. Should I change the label "Dastavej" for them too?
    // The user explicitly said: "Property Purchase Loan → Category: Wherever the label “Dastavej” appears within the Category section, change it to “Document List”."
    // This implies ONLY for Property Purchase Loan Category section.
    // So I will only replace "Dastavej Rate" and "Dastavej Name" labels!
    content = content.replace(/>Dastavej Rate</g, '>Document List Rate<');
    content = content.replace(/>Dastavej Name</g, '>Document List Name<');

    // 2. Remove "Plot Loan" option entirely
    content = content.replace(/<option value="Plot Loan">Plot Loan<\/option>\s*/g, '');
    content = content.replace(/<option value="Plot Loan">Plot<\/option>\s*/g, '');

    // 3. Remove "Lease Rental Discounting" option entirely
    content = content.replace(/<option value="Lease Rental Discounting">Lease Rental Discounting<\/option>\s*/g, '');

    // 4. Update the arrays `["Working Capital", "Plot Loan", "Lease Rental Discounting"]` to `["Working Capital"]`
    content = content.replace(/\["Working Capital", "Plot Loan", "Lease Rental Discounting"\]/g, '["Working Capital"]');

    fs.writeFileSync(file, content);
    console.log(`${file} updated.`);
}

updateFile('c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/NewLeadView.jsx');
updateFile('c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/FillFormModal.jsx');
updateFile('c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/MyLeadsView.jsx');
