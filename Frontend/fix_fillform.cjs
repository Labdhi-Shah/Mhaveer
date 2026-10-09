const fs = require('fs');

let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/FillFormModal.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace M.V block
content = content.replace(/<label className="[^"]*">M\.V<\/label>\s*<input type="number" placeholder="Enter M\.V" value=\{naPlotMV\}/, '<label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Property Market Value</label>\\n                                  <input type="number" placeholder="Enter M.V" value={naPlotMV}');

// Replace Yes/No block
const yesnoRe = /<div className="flex items-center gap-2 mt-7">\s*<input type="checkbox" id="naPlotYesNoModal"[^>]*>\s*<label htmlFor="naPlotYesNoModal"[^>]*>Yes \/ No<\/label>\s*<\/div>/;
content = content.replace(yesnoRe, '<div className="hidden">\n                                    <input type="checkbox" id="naPlotYesNoModal" checked={naPlotYesNo} onChange={(e) => setNaPlotYesNo(e.target.checked)} />\n                                  </div>');

// Replace Scheme Name block
content = content.replace(/<label className="[^"]*">Scheme<\/label>\s*<input type="text" placeholder="Enter scheme" value=\{naPlotScheme\}/, '<label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Scheme Name</label>\\n                                  <input type="text" placeholder="Enter scheme" value={naPlotScheme}');

// Replace Lavani block
const lavaniRe = /<div>\s*<label className="[^"]*">Lavani<\/label>\s*<input type="text" placeholder="Enter lavani" value=\{naPlotLavani\}[^>]*>\s*<\/div>/;
content = content.replace(lavaniRe, '<div className="hidden">\n                                    <input type="text" value={naPlotLavani} onChange={(e) => setNaPlotLavani(e.target.value)} />\n                                  </div>');

// Replace Plot Vacant block
const vacantRe = /<div className="flex items-center gap-2 mt-7">\s*<input type="checkbox" id="naPlotVacantModal"[^>]*>\s*<label htmlFor="naPlotVacantModal"[^>]*>Plot Vacant [^<]*<\/label>\s*<\/div>/;

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
    console.log('Plot vacant replaced using regex!');
} else {
    console.log('Plot vacant regex failed to match!');
}

fs.writeFileSync(file, content);
