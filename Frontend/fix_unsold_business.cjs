const fs = require('fs');

function updateNewLeadView() {
    let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/NewLeadView.jsx';
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // 1. Remove unsoldYesNo state, add business states, and unsoldBV to false
    content = content.replace(/unsoldYesNo: false,/, 'businessStartingYear: "",\n      businessTypeOfWork: "",');
    content = content.replace(/unsoldBV: "",/, 'unsoldBV: false,');
    
    // 2. Remove delete unsoldYesNo, add delete for business fields
    content = content.replace(/delete payload\.unsoldYesNo;\n\s*/g, '');
    content = content.replace(/delete payload\.businessLoanType;/, 'delete payload.businessLoanType;\n          delete payload.businessStartingYear;\n          delete payload.businessTypeOfWork;');

    // 3. Remove watch unsoldYesNo, add watch unsoldBV and businessLoanType
    content = content.replace(/const unsoldYesNoValue = watch\("unsoldYesNo"\);/, 
        'const unsoldBVValue = watch("unsoldBV");\n  const businessLoanTypeValue = watch("businessLoanType");');

    // 4. Remove Selection block completely
    const selectionRegex = /<div>\s*<label className=\{labelClass\}>Selection<\/label>\s*<div className="flex items-center gap-4">[\s\S]*?<\/div>\s*<\/div>/;
    content = content.replace(selectionRegex, '');

    // 5. Replace B.U input with Yes/No buttons
    const buRegex = /<div>\s*<label className=\{labelClass\}>B\.U<\/label>\s*<input type="number" placeholder="Enter B\.U" \{\.\.\.register\("unsoldBV"[^>]*>\s*\{errors\.unsoldBV[^<]*<\/p>\}\s*<\/div>/;
    const newBuJSX = `<div>
                  <label className={labelClass}>B.U</label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setValue("unsoldBV", true, { shouldValidate: true })}
                      className={\`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all \${
                        unsoldBVValue === true
                          ? "border-[#162335] bg-[#162335]/5 text-[#162335]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }\`}
                    >
                      Yes
                      <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all \${
                        unsoldBVValue === true
                          ? "border-[#162335] bg-[#162335]"
                          : "border-slate-300"
                      }\`}>
                        {unsoldBVValue === true && <CheckCircle size={14} className="text-white" />}
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setValue("unsoldBV", false, { shouldValidate: true })}
                      className={\`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all \${
                        unsoldBVValue === false
                          ? "border-[#162335] bg-[#162335]/5 text-[#162335]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }\`}
                    >
                      No
                      <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all \${
                        unsoldBVValue === false
                          ? "border-[#162335] bg-[#162335]"
                          : "border-slate-300"
                      }\`}>
                        {unsoldBVValue === false && <CheckCircle size={14} className="text-white" />}
                      </div>
                    </button>
                  </div>
                </div>`;
    content = content.replace(buRegex, newBuJSX);

    // 6. Add Unsecured fields in Business Loan
    const unsecuredBlock = `
              {loanTypeValue === "Business Loan" && businessLoanTypeValue === "Unsecured" && (
                <>
                  <div>
                    <label className={labelClass}>Company Starting Year</label>
                    <input type="text" placeholder="Enter starting year" {...register("businessStartingYear", { required: "Company Starting Year is required" })} className={getInputClass(errors.businessStartingYear)} />
                    {errors.businessStartingYear && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.businessStartingYear.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Type of Work</label>
                    <input type="text" placeholder="Enter type of work" {...register("businessTypeOfWork", { required: "Type of Work is required" })} className={getInputClass(errors.businessTypeOfWork)} />
                    {errors.businessTypeOfWork && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.businessTypeOfWork.message}</p>}
                  </div>
                </>
              )}`;
    content = content.replace(/\{errors\.businessLoanType\.message\}<\/p>\}\s*<\/div>\s*\)\}/, match => match + "\n" + unsecuredBlock);

    fs.writeFileSync(file, content);
    console.log("NewLeadView.jsx updated.");
}

function updateFillFormModal() {
    let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/FillFormModal.jsx';
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // 1. Remove unsoldYesNo state, add business states, and change unsoldBV to boolean
    content = content.replace(/const \[unsoldYesNo, setUnsoldYesNo\] = useState\(false\);\n\s*/, 'const [businessStartingYear, setBusinessStartingYear] = useState("");\n  const [businessTypeOfWork, setBusinessTypeOfWork] = useState("");\n');
    content = content.replace(/const \[unsoldBV, setUnsoldBV\] = useState\(""\);/, 'const [unsoldBV, setUnsoldBV] = useState(false);');

    // 2. Validation
    // if (loanType === "Business Loan") return !!businessLoanType && !!businessType;
    content = content.replace(/if \(loanType === "Business Loan"\) return !!businessLoanType && !!businessType;/,
        'if (loanType === "Business Loan") { if (businessLoanType === "Unsecured" && (!businessStartingYear || !businessTypeOfWork)) return false; return !!businessLoanType && !!businessType; }');
    
    // 3. Delete unsoldYesNo validation constraint
    // !unsoldFloor || !unsoldDastavej || !unsoldPartnership)) return false; (No unsoldYesNo in the constraint actually! Wait, let's verify later)

    // 4. Append
    content = content.replace(/if \(unsoldYesNo\) formData\.append\("unsoldYesNo", unsoldYesNo\);\n\s*/, '');
    content = content.replace(/if \(businessLoanType\) formData\.append\("businessLoanType", businessLoanType\);/, 
        'if (businessLoanType) formData.append("businessLoanType", businessLoanType);\n      if (businessStartingYear) formData.append("businessStartingYear", businessStartingYear);\n      if (businessTypeOfWork) formData.append("businessTypeOfWork", businessTypeOfWork);');
    content = content.replace(/formData\.append\("unsoldBV", unsoldBV\);/, 'formData.append("unsoldBV", unsoldBV);'); // already handled if it is appended directly

    // 5. useEffect
    content = content.replace(/setUnsoldYesNo\(lead\.formData\?\.unsoldYesNo \|\| false\);\n\s*/, 'setBusinessStartingYear(lead.formData?.businessStartingYear || "");\n      setBusinessTypeOfWork(lead.formData?.businessTypeOfWork || "");\n');
    content = content.replace(/setUnsoldBV\(lead\.formData\?\.unsoldBV \|\| ""\);/, 'setUnsoldBV(lead.formData?.unsoldBV || false);');

    // 6. Remove Selection block
    const selectionRegex = /<div>\s*<label className="block text-\[13px\] font-semibold text-slate-700 mb-1\.5">Selection<\/label>\s*<div className="flex items-center gap-4">[\s\S]*?<\/div>\s*<\/div>/;
    content = content.replace(selectionRegex, '');

    // 7. Replace B.U input
    const buRegex = /<div>\s*<label className="block text-\[13px\] font-semibold text-slate-700 mb-1\.5">B\.U<\/label>\s*<input type="number" placeholder="Enter B\.U"[^>]*>\s*<\/div>/;
    const newBuJSX = `<div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">B.U</label>
                                  <div className="flex items-center gap-4">
                                    <button
                                      type="button"
                                      onClick={() => setUnsoldBV(true)}
                                      className={\`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all \${
                                        unsoldBV === true
                                          ? "border-[#162335] bg-[#162335]/5 text-[#162335]"
                                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                      }\`}
                                    >
                                      Yes
                                      <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all \${
                                        unsoldBV === true
                                          ? "border-[#162335] bg-[#162335]"
                                          : "border-slate-300"
                                      }\`}>
                                        {unsoldBV === true && <CheckCircle size={14} className="text-white" />}
                                      </div>
                                    </button>
                                    
                                    <button
                                      type="button"
                                      onClick={() => setUnsoldBV(false)}
                                      className={\`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all \${
                                        unsoldBV === false
                                          ? "border-[#162335] bg-[#162335]/5 text-[#162335]"
                                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                      }\`}
                                    >
                                      No
                                      <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all \${
                                        unsoldBV === false
                                          ? "border-[#162335] bg-[#162335]"
                                          : "border-slate-300"
                                      }\`}>
                                        {unsoldBV === false && <CheckCircle size={14} className="text-white" />}
                                      </div>
                                    </button>
                                  </div>
                                </div>`;
    content = content.replace(buRegex, newBuJSX);

    // 8. Add Unsecured fields
    const unsecuredBlock = `
                            {loanType === "Business Loan" && businessLoanType === "Unsecured" && (
                              <>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Company Starting Year</label>
                                  <input type="text" placeholder="Enter starting year" value={businessStartingYear} onChange={(e) => setBusinessStartingYear(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Type of Work</label>
                                  <input type="text" placeholder="Enter type of work" value={businessTypeOfWork} onChange={(e) => setBusinessTypeOfWork(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                </div>
                              </>
                            )}`;
    
    // We can insert this right before {loanType === "Balance Transfer" && (
    content = content.replace(/\{loanType === "Balance Transfer" && \(/, match => unsecuredBlock + "\n\n                            " + match);

    fs.writeFileSync(file, content);
    console.log("FillFormModal.jsx updated.");
}

updateNewLeadView();
updateFillFormModal();
