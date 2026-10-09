const fs = require('fs');

function updateNewLeadView() {
    let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/NewLeadView.jsx';
    let content = fs.readFileSync(file, 'utf8');

    // 1. Location -> Property of Location
    content = content.replace(
        /<label className=\{labelClass\}>Location<\/label>/g,
        '<label className={labelClass}>Property of Location</label>'
    );

    // 2. Dastavej -> Document List
    content = content.replace(
        /<label className=\{labelClass\}>Dastavej<\/label>/g,
        '<label className={labelClass}>Document List</label>'
    );

    // 3. Add Work and Document List inside LAP
    const lapBlockMatch = /<input type="number" placeholder="Enter market value"[^>]*>\s*\{errors\.lapPropertyMarketValue[^}]*\}<\/p>\}\s*<\/div>/;
    const lapFieldsToAdd = `
                      <div>
                        <label className={labelClass}>Work</label>
                        <input type="text" placeholder="Enter work" {...register("lapPropertyWork", { required: "Work is required" })} className={getInputClass(errors.lapPropertyWork)} />
                        {errors.lapPropertyWork && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lapPropertyWork.message}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Document List</label>
                        <input type="text" placeholder="Enter document list" {...register("lapPropertyDocumentList", { required: "Document List is required" })} className={getInputClass(errors.lapPropertyDocumentList)} />
                        {errors.lapPropertyDocumentList && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lapPropertyDocumentList.message}</p>}
                      </div>`;
    
    if (lapBlockMatch.test(content)) {
        content = content.replace(lapBlockMatch, match => match + lapFieldsToAdd);
    } else {
        console.error("Could not find lap block in NewLeadView");
    }

    // 4. Default Values
    content = content.replace(
        /lapPropertyMarketValue: "",/,
        'lapPropertyMarketValue: "",\n      lapPropertyWork: "",\n      lapPropertyDocumentList: "",'
    );

    // 5. Delete payload
    content = content.replace(
        /delete payload\.lapPropertyMarketValue;/,
        'delete payload.lapPropertyMarketValue;\n          delete payload.lapPropertyWork;\n          delete payload.lapPropertyDocumentList;'
    );

    fs.writeFileSync(file, content);
    console.log("NewLeadView.jsx updated.");
}

function updateFillFormModal() {
    let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/FillFormModal.jsx';
    let content = fs.readFileSync(file, 'utf8');

    // 1. Location -> Property of Location
    content = content.replace(
        /<label className="block text-\[13px\] font-semibold text-slate-700 mb-1\.5">Location<\/label>/g,
        '<label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property of Location</label>'
    );

    // 2. Dastavej -> Document List
    content = content.replace(
        /<label className="block text-\[13px\] font-semibold text-slate-700 mb-1\.5">Dastavej<\/label>/g,
        '<label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Document List</label>'
    );

    // 3. Add Work and Document List inside LAP
    const lapBlockMatch = /<input type="number" placeholder="Enter market value" value=\{lapPropertyMarketValue\}[^>]*>\s*<\/div>/;
    const lapFieldsToAdd = `
                                      <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Work</label>
                                        <input type="text" placeholder="Enter work" value={lapPropertyWork} onChange={(e) => setLapPropertyWork(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                      </div>
                                      <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Document List</label>
                                        <input type="text" placeholder="Enter document list" value={lapPropertyDocumentList} onChange={(e) => setLapPropertyDocumentList(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                      </div>`;
    if (lapBlockMatch.test(content)) {
        content = content.replace(lapBlockMatch, match => match + lapFieldsToAdd);
    } else {
        console.error("Could not find lap block in FillFormModal");
    }

    // 4. Use State
    content = content.replace(
        /const \[lapPropertyMarketValue, setLapPropertyMarketValue\] = useState\(""\);/,
        'const [lapPropertyMarketValue, setLapPropertyMarketValue] = useState("");\n    const [lapPropertyWork, setLapPropertyWork] = useState("");\n    const [lapPropertyDocumentList, setLapPropertyDocumentList] = useState("");'
    );

    // 5. Use Effect
    content = content.replace(
        /setLapPropertyMarketValue\(lead\.formData\?\.lapPropertyMarketValue \|\| ""\);/,
        'setLapPropertyMarketValue(lead.formData?.lapPropertyMarketValue || "");\n      setLapPropertyWork(lead.formData?.lapPropertyWork || "");\n      setLapPropertyDocumentList(lead.formData?.lapPropertyDocumentList || "");'
    );

    // 6. Form Data append
    content = content.replace(
        /if \(lapPropertyMarketValue\) formData\.append\("lapPropertyMarketValue", lapPropertyMarketValue\);/,
        'if (lapPropertyMarketValue) formData.append("lapPropertyMarketValue", lapPropertyMarketValue);\n        if (lapPropertyWork) formData.append("lapPropertyWork", lapPropertyWork);\n        if (lapPropertyDocumentList) formData.append("lapPropertyDocumentList", lapPropertyDocumentList);'
    );

    // 7. Validation rules
    // if (propertyLoanCategory === "LAP" && (!lapPropertyType || !lapPropertyLocation || !lapPropertyMarketValue)) return false;
    content = content.replace(
        /!lapPropertyMarketValue\)\) return false;/,
        '!lapPropertyMarketValue || !lapPropertyWork || !lapPropertyDocumentList)) return false;'
    );

    fs.writeFileSync(file, content);
    console.log("FillFormModal.jsx updated.");
}

updateNewLeadView();
updateFillFormModal();
