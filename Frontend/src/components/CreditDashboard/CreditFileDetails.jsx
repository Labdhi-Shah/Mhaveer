import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import { ArrowLeft, FileText, CheckCircle, XCircle, FileImage, Download, Save, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function CreditFileDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Local state for edits
  const [docsVerification, setDocsVerification] = useState({});
  const [creditDetails, setCreditDetails] = useState({});
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFileDetails();
  }, [id]);

  const fetchFileDetails = async () => {
    try {
      const res = await api.get(`/credit/files/${id}`);
      if (res.data.success) {
        const data = res.data.data;
        setFileData(data);
        
        // Initialize local state
        setDocsVerification(data.documentVerification || {});
        setCreditDetails(data.creditDetails || {});
        setRemarks(data.creditRemarks || "");
      }
    } catch (error) {
      console.error("Error fetching credit file:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocVerifyChange = (docName, status) => {
    setDocsVerification(prev => ({
      ...prev,
      [docName]: status
    }));
  };

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setCreditDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/credit/files/${id}/details`, {
        creditDetails,
        creditRemarks: remarks,
        documentVerification: docsVerification
      });
      if (res.data.success) {
        alert("Details saved successfully!");
        fetchFileDetails();
      }
    } catch (error) {
      console.error("Error saving details:", error);
      alert("Failed to save details");
    } finally {
      setSaving(false);
    }
  };

  const handleDecision = async (decision) => {
    if (!window.confirm(`Are you sure you want to ${decision} this file?`)) return;
    setSaving(true);
    try {
      const res = await api.put(`/credit/files/${id}/decision`, {
        decision: decision,
        remarks: remarks
      });
      if (res.data.success) {
        alert(`File ${decision} successfully!`);
        navigate("/credit/files");
      }
    } catch (error) {
      console.error(`Error marking file as ${decision}:`, error);
      alert(`Failed to ${decision} file`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">Loading File Details...</div>;
  if (!fileData) return <div className="p-8 text-center font-bold text-red-500">File not found.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="bg-white border border-slate-200 p-2 rounded-xl text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#0a2540]">Review Loan Application</h1>
          <p className="text-sm font-bold text-slate-500">Applicant: {fileData.fullName} | Status: <span className="text-[#d4af37]">{fileData.creditStatus}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Info & Docs) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Info Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-black text-[#0a2540] mb-4 flex items-center gap-2">
              <Users size={20} className="text-[#d4af37]" />
              Applicant Details
            </h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-slate-400 font-bold mb-1">Full Name</p>
                <p className="font-semibold text-slate-700">{fileData.fullName || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold mb-1">Mobile</p>
                <p className="font-semibold text-slate-700">{fileData.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold mb-1">Email</p>
                <p className="font-semibold text-slate-700">{fileData.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold mb-1">Cibil Score (Reported)</p>
                <p className="font-semibold text-slate-700">{fileData.cibilScore || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold mb-1">Loan Amount</p>
                <p className="font-semibold text-slate-700">{fileData.loanAmount || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold mb-1">Employment Type</p>
                <p className="font-semibold text-slate-700">{fileData.eligibility?.employmentType || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-400 font-bold mb-1">Address</p>
                <p className="font-semibold text-slate-700">{fileData.residenceAddress || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Documents Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-black text-[#0a2540] mb-4 flex items-center gap-2">
              <FileImage size={20} className="text-[#d4af37]" />
              Document Verification
            </h2>
            
            {(!fileData.documents || Object.keys(fileData.documents).filter(k => fileData.documents[k] && fileData.documents[k].path).length === 0) ? (
              <p className="text-sm text-slate-500 italic">No documents uploaded.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(fileData.documents)
                  .filter(([key, doc]) => doc && doc.path)
                  .map(([key, doc], idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border border-slate-100 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#0a2540] text-white p-2 rounded-lg">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#0a2540]">{doc.name || key}</p>
                        <a href={`${(api.defaults.baseURL || 'http://localhost:5000/api').replace('/api', '')}/uploads/${doc.path.split('\\').pop().split('/').pop()}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 font-semibold hover:underline flex items-center gap-1 mt-1">
                          <Download size={12}/> View / Download
                        </a>
                      </div>
                    </div>
                    
                    {/* Verification Toggle */}
                    <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                      <button 
                        onClick={() => handleDocVerifyChange(key, 'Verified')}
                        className={`px-3 py-1.5 text-xs font-bold transition ${docsVerification[key] === 'Verified' ? 'bg-green-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                      >
                        Verified
                      </button>
                      <button 
                        onClick={() => handleDocVerifyChange(key, 'Rejected')}
                        className={`px-3 py-1.5 text-xs font-bold transition ${docsVerification[key] === 'Rejected' ? 'bg-red-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                      >
                        Rejected
                      </button>
                      <button 
                        onClick={() => handleDocVerifyChange(key, 'Pending')}
                        className={`px-3 py-1.5 text-xs font-bold transition ${(!docsVerification[key] || docsVerification[key] === 'Pending') ? 'bg-orange-400 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                      >
                        Pending
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Credit Details & Actions) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-[#0a2540]">Credit Analysis</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Verified CIBIL Score</label>
                <input 
                  type="number" 
                  name="verifiedCibil"
                  value={creditDetails.verifiedCibil || ""}
                  onChange={handleDetailChange}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#0a2540] focus:outline-none"
                  placeholder="Enter pulled CIBIL"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Eligible Loan Amount</label>
                <input 
                  type="number" 
                  name="eligibleAmount"
                  value={creditDetails.eligibleAmount || ""}
                  onChange={handleDetailChange}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#0a2540] focus:outline-none"
                  placeholder="₹"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">FOIR (%)</label>
                <input 
                  type="number" 
                  name="foir"
                  value={creditDetails.foir || ""}
                  onChange={handleDetailChange}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#0a2540] focus:outline-none"
                  placeholder="Fixed Obligation to Income Ratio"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Proposed ROI (%)</label>
                <input 
                  type="number" 
                  name="proposedRoi"
                  value={creditDetails.proposedRoi || ""}
                  onChange={handleDetailChange}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#0a2540] focus:outline-none"
                  placeholder="Rate of Interest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Tenure (Months)</label>
                <input 
                  type="number" 
                  name="tenure"
                  value={creditDetails.tenure || ""}
                  onChange={handleDetailChange}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#0a2540] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Underwriter Remarks</label>
                <textarea 
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows="3"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#0a2540] focus:outline-none resize-none"
                  placeholder="Internal notes..."
                ></textarea>
              </div>

              <button 
                onClick={handleSaveDetails}
                disabled={saving}
                className="w-full bg-slate-100 text-[#0a2540] font-bold py-3 rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Progress"}
              </button>
            </div>
          </div>

          {/* Final Decision Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-[#d4af37]">
            <h2 className="text-lg font-black text-[#0a2540] mb-4">Final Decision</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleDecision("Approved")}
                disabled={saving}
                className="bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} /> Approve
              </button>
              <button 
                onClick={() => handleDecision("Rejected")}
                disabled={saving}
                className="bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition flex items-center justify-center gap-2"
              >
                <XCircle size={18} /> Reject
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
