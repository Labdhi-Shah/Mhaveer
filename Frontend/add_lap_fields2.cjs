const fs = require('fs');
let file = 'c:/Users/Labdhi/Desktop/Mhaveer/Frontend/src/components/FillFormModal.jsx';
let content = fs.readFileSync(file, 'utf8');

const lapBlockMatch = /<input type="number" placeholder="Enter market value" value=\{lapPropertyMarketValue\}[\s\S]*?<\/div>/;
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
    fs.writeFileSync(file, content);
    console.log("Successfully added lap fields to FillFormModal");
} else {
    console.error("Still failing to find lapBlockMatch in FillFormModal");
}
