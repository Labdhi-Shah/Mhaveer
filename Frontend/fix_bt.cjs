const fs = require('fs');

function updateNewLeadView() {
    let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/NewLeadView.jsx';
    let content = fs.readFileSync(file, 'utf8');

    // 1. Initial State
    content = content.replace(/btYear: "",/, 'btDuration: "",');
    content = content.replace(/btAmount: "",\s*/, '');

    // 2. Delete payload block
    content = content.replace(/delete payload\.btYear;/, 'delete payload.btDuration;');
    content = content.replace(/delete payload\.btAmount;\s*/, '');

    // 3. JSX replacement for Year -> Duration
    const yearRegex = /<div>\s*<label className=\{labelClass\}>Year<\/label>\s*<select \{\.\.\.register\("btYear"[\s\S]*?<\/div>/;
    const newDurationJSX = `<div>
                  <label className={labelClass}>Duration</label>
                  <input type="text" placeholder="Enter duration" {...register("btDuration", { required: "Duration is required" })} className={getInputClass(errors.btDuration)} />
                  {errors.btDuration && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.btDuration.message}</p>}
                </div>`;
    content = content.replace(yearRegex, newDurationJSX);

    // 4. JSX removal for Amount
    const amountRegex = /<div>\s*<label className=\{labelClass\}>Amount<\/label>\s*<input type="number" placeholder="Enter amount" \{\.\.\.register\("btAmount"[\s\S]*?<\/div>/;
    content = content.replace(amountRegex, '');

    fs.writeFileSync(file, content);
    console.log("NewLeadView.jsx updated.");
}

function updateFillFormModal() {
    let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/FillFormModal.jsx';
    let content = fs.readFileSync(file, 'utf8');

    // 1. useState
    content = content.replace(/const \[btYear, setBtYear\] = useState\(""\);/, 'const [btDuration, setBtDuration] = useState("");');
    content = content.replace(/const \[btAmount, setBtAmount\] = useState\(""\);\s*/, '');

    // 2. Validation
    content = content.replace(/&& !!btYear/, '&& !!btDuration');
    content = content.replace(/&& !!btAmount\s*/, '');

    // 3. FormData Append
    content = content.replace(/if \(btYear\) formData\.append\("btYear", btYear\);/, 'if (btDuration) formData.append("btDuration", btDuration);');
    content = content.replace(/if \(btAmount\) formData\.append\("btAmount", btAmount\);\s*/, '');

    // 4. useEffect (if it exists)
    content = content.replace(/setBtYear\(lead\.formData\?\.btYear \|\| ""\);/g, 'setBtDuration(lead.formData?.btDuration || "");');
    content = content.replace(/setBtAmount\(lead\.formData\?\.btAmount \|\| ""\);\s*/g, '');

    // 5. JSX replacement for Year -> Duration
    const yearRegex = /<div>\s*<label className="block text-\[13px\] font-semibold text-slate-700 mb-1\.5">Year<\/label>\s*<select value=\{btYear\}[\s\S]*?<\/div>/;
    const newDurationJSX = `<div>
                              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Duration</label>
                              <input type="text" placeholder="Enter duration" value={btDuration} onChange={(e) => setBtDuration(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                            </div>`;
    content = content.replace(yearRegex, newDurationJSX);

    // 6. JSX removal for Amount
    const amountRegex = /<div>\s*<label className="block text-\[13px\] font-semibold text-slate-700 mb-1\.5">Amount<\/label>\s*<input type="number" placeholder="Enter amount" value=\{btAmount\}[\s\S]*?<\/div>/;
    content = content.replace(amountRegex, '');

    fs.writeFileSync(file, content);
    console.log("FillFormModal.jsx updated.");
}

updateNewLeadView();
updateFillFormModal();
