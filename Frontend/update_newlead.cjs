const fs = require('fs');

let content = fs.readFileSync('c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/NewLeadView.jsx', 'utf8');

// 1. Add watch variable
if (!content.includes('naPlotVacantValue')) {
    content = content.replace('const unsoldYesNoValue = watch("unsoldYesNo");', 'const unsoldYesNoValue = watch("unsoldYesNo");\n  const naPlotVacantValue = watch("naPlotVacant");');
}

// 2. Replace NA Plot section
const oldNaPlot = `                <div>
                  <label className={labelClass}>Location *</label>
                  <input type="text" placeholder="Enter location" {...register("naPlotLocation", { required: "Location is required" })} className={getInputClass(errors.naPlotLocation)} />
                  {errors.naPlotLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotLocation.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>M.V *</label>
                  <input type="number" placeholder="Enter M.V" {...register("naPlotMV", { required: "M.V is required", min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.naPlotMV)} />
                  {errors.naPlotMV && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotMV.message}</p>}
                </div>
                <div className="flex items-center gap-2 mt-7">
                  <input type="checkbox" id="naPlotYesNo" {...register("naPlotYesNo")} className="w-4 h-4 text-[#162335] bg-slate-100 border-slate-300 rounded focus:ring-[#162335] focus:ring-2" />
                  <label htmlFor="naPlotYesNo" className="text-[13px] font-semibold text-slate-700">Yes / No</label>
                </div>
                <div>
                  <label className={labelClass}>Dastavej *</label>
                  <input type="text" placeholder="Enter dastavej" {...register("naPlotDastavej", { required: "Dastavej is required" })} className={getInputClass(errors.naPlotDastavej)} />
                  {errors.naPlotDastavej && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotDastavej.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>VAR *</label>
                  <input type="text" placeholder="Enter VAR" {...register("naPlotVAR", { required: "VAR is required" })} className={getInputClass(errors.naPlotVAR)} />
                  {errors.naPlotVAR && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotVAR.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Scheme *</label>
                  <input type="text" placeholder="Enter scheme" {...register("naPlotScheme", { required: "Scheme is required" })} className={getInputClass(errors.naPlotScheme)} />
                  {errors.naPlotScheme && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotScheme.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Lavani *</label>
                  <input type="text" placeholder="Enter lavani" {...register("naPlotLavani", { required: "Lavani is required" })} className={getInputClass(errors.naPlotLavani)} />
                  {errors.naPlotLavani && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotLavani.message}</p>}
                </div>
                <div className="flex items-center gap-2 mt-7">
                  <input type="checkbox" id="naPlotVacant" {...register("naPlotVacant")} className="w-4 h-4 text-[#162335] bg-slate-100 border-slate-300 rounded focus:ring-[#162335] focus:ring-2" />
                  <label htmlFor="naPlotVacant" className="text-[13px] font-semibold text-slate-700">Plot Vacant — Yes / No</label>
                </div>`;

const newNaPlot = `                <div>
                  <label className={labelClass}>Location</label>
                  <input type="text" placeholder="Enter location" {...register("naPlotLocation", { required: "Location is required" })} className={getInputClass(errors.naPlotLocation)} />
                  {errors.naPlotLocation && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotLocation.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Property Market Value</label>
                  <input type="number" placeholder="Enter M.V" {...register("naPlotMV", { required: "Property Market Value is required", min: { value: 0, message: "Value must be non-negative" } })} className={getInputClass(errors.naPlotMV)} />
                  {errors.naPlotMV && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotMV.message}</p>}
                </div>
                <div className="hidden">
                  <input type="checkbox" id="naPlotYesNo" {...register("naPlotYesNo")} />
                </div>
                <div>
                  <label className={labelClass}>Dastavej</label>
                  <input type="text" placeholder="Enter dastavej" {...register("naPlotDastavej", { required: "Dastavej is required" })} className={getInputClass(errors.naPlotDastavej)} />
                  {errors.naPlotDastavej && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotDastavej.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>VAR</label>
                  <input type="text" placeholder="Enter VAR" {...register("naPlotVAR", { required: "VAR is required" })} className={getInputClass(errors.naPlotVAR)} />
                  {errors.naPlotVAR && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotVAR.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Scheme Name</label>
                  <input type="text" placeholder="Enter scheme" {...register("naPlotScheme", { required: "Scheme Name is required" })} className={getInputClass(errors.naPlotScheme)} />
                  {errors.naPlotScheme && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.naPlotScheme.message}</p>}
                </div>
                <div className="hidden">
                  <input type="text" defaultValue="N/A" {...register("naPlotLavani")} />
                </div>
                <div>
                  <label className={labelClass}>Plot Vacant</label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setValue("naPlotVacant", true, { shouldValidate: true })}
                      className={\`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all \${
                        naPlotVacantValue === true
                          ? "border-[#162335] bg-[#162335]/5 text-[#162335]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }\`}
                    >
                      Yes
                      <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all \${
                        naPlotVacantValue === true
                          ? "border-[#162335] bg-[#162335]"
                          : "border-slate-300"
                      }\`}>
                        {naPlotVacantValue === true && <CheckCircle size={14} className="text-white" />}
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setValue("naPlotVacant", false, { shouldValidate: true })}
                      className={\`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all \${
                        naPlotVacantValue === false
                          ? "border-[#162335] bg-[#162335]/5 text-[#162335]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }\`}
                    >
                      No
                      <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all \${
                        naPlotVacantValue === false
                          ? "border-[#162335] bg-[#162335]"
                          : "border-slate-300"
                      }\`}>
                        {naPlotVacantValue === false && <CheckCircle size={14} className="text-white" />}
                      </div>
                    </button>
                  </div>
                </div>`;

if (content.includes('Enter dastavej') && content.includes('naPlotLavani')) {
    content = content.replace(oldNaPlot, newNaPlot);
} else {
    console.log('Could not find exact block!');
}

content = content.replace(/<label className=\{labelClass\}>B\.V \*/g, '<label className={labelClass}>B.U');
content = content.replace(/<label className=\{labelClass\}>B\.V<\/label>/g, '<label className={labelClass}>B.U</label>');
// Only replace B.V * when it stands alone (if any)
content = content.replace(/>B\.V \*/g, '>B.U');
content = content.replace(/>B\.V</g, '>B.U<');

// Remove * globally in NewLeadView labels
content = content.replace(/<label className=\{labelClass\}>(.*?)\s*\*\s*<\/label>/g, '<label className={labelClass}>$1</label>');
content = content.replace(/<label className="([^"]*)">(.*?)\s*\*\s*<\/label>/g, '<label className="$1">$2</label>');

fs.writeFileSync('c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/NewLeadView.jsx', content);
console.log('Updated NewLeadView.jsx');
