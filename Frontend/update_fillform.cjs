const fs = require('fs');

let content = fs.readFileSync('c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/FillFormModal.jsx', 'utf8');

const oldNaPlot = `                              {propertyLoanCategory === "NA Plot" && (
                                <>
                                  <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Location *</label>
                                    <input type="text" placeholder="Enter location" value={naPlotLocation} onChange={(e) => setNaPlotLocation(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">M.V *</label>
                                    <input type="number" placeholder="Enter M.V" value={naPlotMV} onChange={(e) => setNaPlotMV(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" min="0" />
                                  </div>
                                  <div className="flex items-center gap-2 mt-7">
                                    <input type="checkbox" id="naPlotYesNoModal" checked={naPlotYesNo} onChange={(e) => setNaPlotYesNo(e.target.checked)} className="w-4 h-4 text-[#162335] bg-slate-100 border-slate-300 rounded focus:ring-[#162335] focus:ring-2" />
                                    <label htmlFor="naPlotYesNoModal" className="text-[13px] font-semibold text-slate-700">Yes / No</label>
                                  </div>
                                  <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Dastavej *</label>
                                    <input type="text" placeholder="Enter dastavej" value={naPlotDastavej} onChange={(e) => setNaPlotDastavej(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">VAR *</label>
                                    <input type="text" placeholder="Enter VAR" value={naPlotVAR} onChange={(e) => setNaPlotVAR(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Scheme *</label>
                                    <input type="text" placeholder="Enter scheme" value={naPlotScheme} onChange={(e) => setNaPlotScheme(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Lavani *</label>
                                    <input type="text" placeholder="Enter lavani" value={naPlotLavani} onChange={(e) => setNaPlotLavani(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                  </div>
                                  <div className="flex items-center gap-2 mt-7">
                                    <input type="checkbox" id="naPlotVacantModal" checked={naPlotVacant} onChange={(e) => setNaPlotVacant(e.target.checked)} className="w-4 h-4 text-[#162335] bg-slate-100 border-slate-300 rounded focus:ring-[#162335] focus:ring-2" />
                                    <label htmlFor="naPlotVacantModal" className="text-[13px] font-semibold text-slate-700">Plot Vacant — Yes / No</label>
                                  </div>
                                </>
                              )}`;

const newNaPlot = `                              {propertyLoanCategory === "NA Plot" && (
                                <>
                                  <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Location</label>
                                    <input type="text" placeholder="Enter location" value={naPlotLocation} onChange={(e) => setNaPlotLocation(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Property Market Value</label>
                                    <input type="number" placeholder="Enter M.V" value={naPlotMV} onChange={(e) => setNaPlotMV(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" min="0" />
                                  </div>
                                  <div className="hidden">
                                    <input type="checkbox" id="naPlotYesNoModal" checked={naPlotYesNo} onChange={(e) => setNaPlotYesNo(e.target.checked)} />
                                  </div>
                                  <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Dastavej</label>
                                    <input type="text" placeholder="Enter dastavej" value={naPlotDastavej} onChange={(e) => setNaPlotDastavej(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">VAR</label>
                                    <input type="text" placeholder="Enter VAR" value={naPlotVAR} onChange={(e) => setNaPlotVAR(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Scheme Name</label>
                                    <input type="text" placeholder="Enter scheme" value={naPlotScheme} onChange={(e) => setNaPlotScheme(e.target.value)} required className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                  </div>
                                  <div className="hidden">
                                    <input type="text" placeholder="Enter lavani" value={naPlotLavani || "N/A"} onChange={(e) => setNaPlotLavani(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#162335]/20 focus:bg-white transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Plot Vacant</label>
                                    <div className="flex items-center gap-4">
                                      <button
                                        type="button"
                                        onClick={() => setNaPlotVacant(true)}
                                        className={\`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all \${
                                          naPlotVacant === true
                                            ? "border-[#162335] bg-[#162335]/5 text-[#162335]"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }\`}
                                      >
                                        Yes
                                        <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all \${
                                          naPlotVacant === true
                                            ? "border-[#162335] bg-[#162335]"
                                            : "border-slate-300"
                                        }\`}>
                                          {naPlotVacant === true && <CheckCircle size={14} className="text-white" />}
                                        </div>
                                      </button>
                                      
                                      <button
                                        type="button"
                                        onClick={() => setNaPlotVacant(false)}
                                        className={\`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all \${
                                          naPlotVacant === false
                                            ? "border-[#162335] bg-[#162335]/5 text-[#162335]"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }\`}
                                      >
                                        No
                                        <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all \${
                                          naPlotVacant === false
                                            ? "border-[#162335] bg-[#162335]"
                                            : "border-slate-300"
                                        }\`}>
                                          {naPlotVacant === false && <CheckCircle size={14} className="text-white" />}
                                        </div>
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}`;

if (content.includes('naPlotLavani') && content.includes('propertyLoanCategory === "NA Plot"')) {
    content = content.replace(oldNaPlot, newNaPlot);
} else {
    console.log('Could not find block in FillFormModal.jsx');
}

// Ensure B.V -> B.U
content = content.replace(/<label className="block text-\[13px\] font-semibold text-slate-700 mb-1\.5">B\.V \*/g, '<label className="block text-[13px] font-semibold text-slate-700 mb-1.5">B.U');
content = content.replace(/<label className="block text-\[13px\] font-semibold text-slate-700 mb-1\.5">B\.V<\/label>/g, '<label className="block text-[13px] font-semibold text-slate-700 mb-1.5">B.U</label>');

// Globally remove asterisks from labels in FillFormModal.jsx
content = content.replace(/<label className="([^"]*)">(.*?)\s*\*\s*<\/label>/g, '<label className="$1">$2</label>');

fs.writeFileSync('c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/FillFormModal.jsx', content);
console.log('Updated FillFormModal.jsx');
