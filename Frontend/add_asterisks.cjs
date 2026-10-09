const fs = require('fs');

function updateNewLeadView() {
    let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/NewLeadView.jsx';
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    content = content.replace(/<label className=\{labelClass\}>Company Name<\/label>/g, '<label className={labelClass}>Company Name *</label>');
    content = content.replace(/<label className=\{labelClass\}>Contact Person Name<\/label>/g, '<label className={labelClass}>Contact Person Name *</label>');
    content = content.replace(/<label className=\{labelClass\}>Phone Number<\/label>/g, '<label className={labelClass}>Phone Number *</label>');
    content = content.replace(/<label className=\{labelClass\}>State<\/label>/g, '<label className={labelClass}>State *</label>');
    content = content.replace(/<label className=\{labelClass\}>City<\/label>/g, '<label className={labelClass}>City *</label>');
    content = content.replace(/<label className=\{labelClass\}>Type of Loan<\/label>/g, '<label className={labelClass}>Type of Loan *</label>');
    content = content.replace(/<label className=\{labelClass\}>Address<\/label>/g, '<label className={labelClass}>Address *</label>');

    fs.writeFileSync(file, content);
    console.log("NewLeadView.jsx updated.");
}

function updateMyLeadsView() {
    let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/MyLeadsView.jsx';
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // In MyLeadsView, some labels are empty. We should add the text with asterisk.
    content = content.replace(/\{\/\*\s*Company Name\s*\*\/\}\s*<div>\s*<label><\/label>/g, 
        '{/* Company Name */}\n                <div>\n                  <label className="block text-xs font-bold text-slate-600 mb-1">Company Name *</label>');
    content = content.replace(/\{\/\*\s*Contact Person Name\s*\*\/\}\s*<div>\s*<label><\/label>/g, 
        '{/* Contact Person Name */}\n                <div>\n                  <label className="block text-xs font-bold text-slate-600 mb-1">Contact Person Name *</label>');
    content = content.replace(/\{\/\*\s*Phone Number\s*\*\/\}\s*<div>\s*<label><\/label>/g, 
        '{/* Phone Number */}\n                <div>\n                  <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number *</label>');
    content = content.replace(/<label className="block text-xs font-bold text-slate-600 mb-1">State<\/label>/g, 
        '<label className="block text-xs font-bold text-slate-600 mb-1">State *</label>');
    content = content.replace(/<label className="block text-xs font-bold text-slate-600 mb-1">City<\/label>/g, 
        '<label className="block text-xs font-bold text-slate-600 mb-1">City *</label>');
    content = content.replace(/\{\/\*\s*Loan Type\s*\*\/\}\s*<div>\s*<label><\/label>/g, 
        '{/* Loan Type */}\n                <div>\n                  <label className="block text-xs font-bold text-slate-600 mb-1">Type of Loan *</label>');
    content = content.replace(/<label className="block text-xs font-bold text-slate-600 mb-1">Address<\/label>/g, 
        '<label className="block text-xs font-bold text-slate-600 mb-1">Address *</label>');

    fs.writeFileSync(file, content);
    console.log("MyLeadsView.jsx updated.");
}

updateNewLeadView();
updateMyLeadsView();
