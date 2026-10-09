const fs = require('fs');

let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/FillFormModal.jsx';
let content = fs.readFileSync(file, 'utf8');

const vacantRe = /<div className="flex items-center gap-2 mt-7">\s*<input[^>]*id="naPlotVacantModal"[\s\S]*?<\/div>/;

const newVacantModal = `<div>
                                    <label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Plot Vacant</label>
                                    <div className="flex items-center gap-4 mt-2">
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
                                  </div>`;
                                  
if (vacantRe.test(content)) {
    content = content.replace(vacantRe, newVacantModal);
    console.log('Plot vacant replaced in FillFormModal!');
    fs.writeFileSync(file, content);
} else {
    console.log('Plot vacant still not matching!');
}
