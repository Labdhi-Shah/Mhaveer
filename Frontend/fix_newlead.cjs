const fs = require('fs');

let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/NewLeadView.jsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const vacantStart = content.indexOf('<div className="flex items-center gap-2 mt-7">\n                  <input type="checkbox" id="naPlotVacant"');
if(vacantStart !== -1) {
    const vacantEnd = content.indexOf('</div>', vacantStart) + 6;
    const oldVacant = content.substring(vacantStart, vacantEnd);
    
    const newVacant = `<div>
                  <label className={labelClass}>Plot Vacant</label>
                  <div className="flex items-center gap-4 mt-2">
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
    content = content.replace(oldVacant, newVacant);
    console.log('Plot vacant successfully replaced in NewLeadView!');
} else {
    console.log('Plot vacant block not found in NewLeadView');
}

fs.writeFileSync(file, content);
