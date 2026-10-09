const fs = require('fs');

function fixNewLeadView() {
    let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/NewLeadView.jsx';
    let content = fs.readFileSync(file, 'utf8');

    // 1. M.V to Property Market Value
    content = content.replace(
        /<label className=\{labelClass\}>M\.V<\/label>\s*<input type="number" placeholder="Enter M\.V" \{\.\.\.register\("naPlotMV", \{ required: "M\.V is required"/g,
        '<label className={labelClass}>Property Market Value</label>\n                  <input type="number" placeholder="Enter M.V" {...register("naPlotMV", { required: "Property Market Value is required"'
    );
    // Also replace in Unsold just in case the user meant that!
    content = content.replace(
        /<label className=\{labelClass\}>M\.V<\/label>\s*<input type="number" placeholder="Enter M\.V" \{\.\.\.register\("unsoldMV", \{ required: "M\.V is required"/g,
        '<label className={labelClass}>Property Market Value</label>\n                  <input type="number" placeholder="Enter M.V" {...register("unsoldMV", { required: "Property Market Value is required"'
    );
    
    // Remove Yes/No from Unsold too, since it is exactly the same shape!
    content = content.replace(
        /<div className="flex items-center gap-2 mt-7">\s*<input type="checkbox" id="unsoldYesNo" \{\.\.\.register\("unsoldYesNo"\)\}[^>]*>\s*<label htmlFor="unsoldYesNo"[^>]*>Yes \/ No<\/label>\s*<\/div>/g,
        '<div className="hidden">\n                  <input type="checkbox" id="unsoldYesNo" {...register("unsoldYesNo")} />\n                </div>'
    );

    // 2. Remove Yes/No options from M.V
    content = content.replace(
        /<div className="flex items-center gap-2 mt-7">\s*<input type="checkbox" id="naPlotYesNo"[^>]*>\s*<label htmlFor="naPlotYesNo"[^>]*>Yes \/ No<\/label>\s*<\/div>/g,
        '<div className="hidden">\n                  <input type="checkbox" id="naPlotYesNo" {...register("naPlotYesNo")} />\n                </div>'
    );

    // 3. Scheme to Scheme Name
    content = content.replace(
        /<label className=\{labelClass\}>Scheme<\/label>\s*<input type="text" placeholder="Enter scheme" \{\.\.\.register\("naPlotScheme"/g,
        '<label className={labelClass}>Scheme Name</label>\n                  <input type="text" placeholder="Enter scheme" {...register("naPlotScheme"'
    );
    content = content.replace(
        /<label className=\{labelClass\}>Scheme<\/label>\s*<input type="text" placeholder="Enter scheme" \{\.\.\.register\("unsoldScheme"/g,
        '<label className={labelClass}>Scheme Name</label>\n                  <input type="text" placeholder="Enter scheme" {...register("unsoldScheme"'
    );
    content = content.replace(
        /\{ required: "Scheme is required" \}/g,
        '{ required: "Scheme Name is required" }'
    );

    // 4. Lavani removal
    content = content.replace(
        /<div>\s*<label className=\{labelClass\}>Lavani<\/label>\s*<input type="text" placeholder="Enter lavani" \{\.\.\.register\("naPlotLavani"[^>]*>\s*\{errors\.naPlotLavani[^}]*\}\}<\/p>\}\s*<\/div>/g,
        '<div className="hidden">\n                  <input type="text" defaultValue="N/A" {...register("naPlotLavani")} />\n                </div>'
    );

    fs.writeFileSync(file, content);
    console.log('NewLeadView.jsx fixed!');
}

function fixFillFormModal() {
    let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/FillFormModal.jsx';
    let content = fs.readFileSync(file, 'utf8');

    // 1. M.V to Property Market Value
    content = content.replace(
        /<label className="[^"]*">M\.V<\/label>\s*<input type="number" placeholder="Enter M\.V" value=\{naPlotMV\}/g,
        '<label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Property Market Value</label>\n                                  <input type="number" placeholder="Enter M.V" value={naPlotMV}'
    );
    content = content.replace(
        /<label className="[^"]*">M\.V<\/label>\s*<input type="number" placeholder="Enter M\.V" value=\{unsoldMV\}/g,
        '<label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Property Market Value</label>\n                                  <input type="number" placeholder="Enter M.V" value={unsoldMV}'
    );

    // 2. Remove Yes/No options
    content = content.replace(
        /<div className="flex items-center gap-2 mt-7">\s*<input type="checkbox" id="naPlotYesNoModal"[^>]*>\s*<label htmlFor="naPlotYesNoModal"[^>]*>Yes \/ No<\/label>\s*<\/div>/g,
        '<div className="hidden">\n                                    <input type="checkbox" id="naPlotYesNoModal" checked={naPlotYesNo} onChange={(e) => setNaPlotYesNo(e.target.checked)} />\n                                  </div>'
    );
    content = content.replace(
        /<div className="flex items-center gap-2 mt-7">\s*<input type="checkbox" id="unsoldYesNoModal"[^>]*>\s*<label htmlFor="unsoldYesNoModal"[^>]*>Yes \/ No<\/label>\s*<\/div>/g,
        '<div className="hidden">\n                                    <input type="checkbox" id="unsoldYesNoModal" checked={unsoldYesNo} onChange={(e) => setUnsoldYesNo(e.target.checked)} />\n                                  </div>'
    );

    // 3. Scheme Name
    content = content.replace(
        /<label className="[^"]*">Scheme<\/label>\s*<input type="text" placeholder="Enter scheme" value=\{naPlotScheme\}/g,
        '<label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Scheme Name</label>\n                                  <input type="text" placeholder="Enter scheme" value={naPlotScheme}'
    );
    content = content.replace(
        /<label className="[^"]*">Scheme<\/label>\s*<input type="text" placeholder="Enter scheme" value=\{unsoldScheme\}/g,
        '<label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Scheme Name</label>\n                                  <input type="text" placeholder="Enter scheme" value={unsoldScheme}'
    );

    // 4. Lavani removal
    content = content.replace(
        /<div>\s*<label className="[^"]*">Lavani<\/label>\s*<input type="text" placeholder="Enter lavani" value=\{naPlotLavani\}[^>]*>\s*<\/div>/g,
        '<div className="hidden">\n                                    <input type="text" value={naPlotLavani} onChange={(e) => setNaPlotLavani(e.target.value)} />\n                                  </div>'
    );

    fs.writeFileSync(file, content);
    console.log('FillFormModal.jsx fixed!');
}

fixNewLeadView();
fixFillFormModal();
