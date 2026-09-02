import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import { ArrowLeft, FileText, CheckCircle, XCircle, FileImage, Download, Save, Users, Building2, Upload } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("applicant");

  // Bank Application State
  const [bankApplied, setBankApplied] = useState("");
  const [bankApplicationStatus, setBankApplicationStatus] = useState("Pending");
  const [bankSanctionedAmount, setBankSanctionedAmount] = useState("");
  const [bankProofFile, setBankProofFile] = useState(null);
  const [submittingBank, setSubmittingBank] = useState(false);
  
  const [bankLinksUnlocked, setBankLinksUnlocked] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const availableBanks = [
    "HDFC Bank",
    "ICICI Bank",
    "State Bank of India (SBI)",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "Bajaj Finserv",
    "Cholamandalam Investment",
    "Piramal Finance",
    "Aditya Birla Finance",
    "Other"
  ];

  const BANK_LINKS = {
    "HDFC Bank": "https://www.hdfcbank.com/personal/borrow/popular-loans/personal-loan",
    "ICICI Bank": "https://www.icicibank.com/personal-banking/loans/personal-loan",
    "State Bank of India (SBI)": "https://sbi.co.in/web/personal-banking/loans/personal-loans",
    "Axis Bank": "https://www.axisbank.com/retail/loans/personal-loan",
    "Kotak Mahindra Bank": "https://www.kotak.com/en/personal-banking/loans/personal-loan.html",
    "Bajaj Finserv": "https://www.bajajfinserv.in/personal-loan"
  };

  useEffect(() => {
    fetchFileDetails();
  }, [id]);



  const fetchFileDetails = async () => {
    try {
      const res = await api.get(`/credit/files/${id}`);
      if (res.data.success) {
        const data = res.data.data;
        setFileData(data);
        
        setDocsVerification(data.documentVerification || {});
        
        // Auto-calculate credit details
        let creditInfo = data.creditDetails || {};
        
        // Populate verifiedCibil from data.cibilScore if not already set
        if (!creditInfo.verifiedCibil && data.cibilScore) {
          creditInfo.verifiedCibil = data.cibilScore;
        }

        const income = Number(data.eligibility?.income) || Number(creditInfo.monthlyIncome) || 0;
        const emi = Number(creditInfo.existingEmi) || 0;
        
        if (income > 0) {
          creditInfo.monthlyIncome = income;
          creditInfo.foir = ((emi / income) * 100).toFixed(2);
          const disposable = (income * 0.60) - emi;
          creditInfo.eligibleAmount = disposable > 0 ? (disposable * 60).toFixed(0) : 0;
        }
        
        setCreditDetails(creditInfo);
        setRemarks(data.creditRemarks || "");
        
        // Load bank info if exists
        setBankApplied(data.bankApplied || "");
        setBankApplicationStatus(data.bankApplicationStatus || "Pending");
        setBankSanctionedAmount(data.bankSanctionedAmount || "");
        setBankLinksUnlocked(data.bankLinksUnlocked || false);
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
    if (decision === "Approved") {
      if (!creditDetails.verifiedCibil || !creditDetails.proposedRoi || !creditDetails.tenure) {
        alert("Please fill Verified CIBIL Score, Proposed ROI, and Tenure before approving.");
        return;
      }
    }
    if (!window.confirm(`Are you sure you want to ${decision} this file internally?`)) return;
    setSaving(true);
    try {
      const res = await api.put(`/credit/files/${id}/decision`, {
        decision: decision,
        remarks: remarks
      });
      if (res.data.success) {
        alert(`File marked as ${decision} successfully!`);
        fetchFileDetails();
      }
    } catch (error) {
      console.error(`Error marking file as ${decision}:`, error);
      alert(`Failed to ${decision} file`);
    } finally {
      setSaving(false);
    }
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    if (!bankApplied) return alert("Please select a bank");
    
    setSubmittingBank(true);
    try {
      const formData = new FormData();
      formData.append("bankApplied", bankApplied);
      formData.append("bankApplicationStatus", bankApplicationStatus);
      if (bankSanctionedAmount) formData.append("bankSanctionedAmount", bankSanctionedAmount);
      if (bankProofFile) formData.append("bankSanctionProof", bankProofFile);

      const res = await api.put(`/credit/files/${id}/bank-application`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        alert("Bank application details saved successfully!");
        fetchFileDetails();
        setBankProofFile(null); // clear file input
      }
    } catch (error) {
      console.error("Error submitting bank application:", error);
      alert(error.response?.data?.message || "Failed to submit bank application");
    } finally {
      setSubmittingBank(false);
    }
  };

  const handleUnlockBanks = async () => {
    try {
      const res = await api.put(`/credit/files/${id}/unlock-banks`);
      if (res.data.success) {
        setBankLinksUnlocked(true);
        alert("Bank Links Unlocked.");
      }
    } catch (err) {
      console.error("Unlock failed", err);
      alert("Failed to unlock banks.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading File Details...</div>;
  if (!fileData) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500">File not found.</div>;

  const tabs = [
    { id: "applicant", label: "Applicant Info", icon: <Users size={18} /> },
    { id: "documents", label: "Documents", icon: <FileImage size={18} /> },
    { id: "credit", label: "Credit Analysis", icon: <FileText size={18} /> },
    { id: "bank", label: "Bank Application", icon: <Building2 size={18} /> }
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37] opacity-10 rounded-full blur-3xl transform translate-x-10 -translate-y-10 pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <button 
            onClick={() => navigate(-1)}
            className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-600 hover:bg-[#0a2540] hover:text-white transition shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#0a2540] tracking-tight">Loan Application Review</h1>
            <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
              Applicant: <span className="text-slate-800 font-bold">{fileData.fullName}</span> 
              <span className="text-slate-300">•</span>
              Status: 
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  fileData.creditStatus === "Approved" ? "bg-green-100 text-green-700" :
                  fileData.creditStatus === "Bank Approved" ? "bg-emerald-100 text-emerald-700" :
                  fileData.creditStatus === "Rejected" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                {fileData.creditStatus || "Pending"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex-1 justify-center ${
              activeTab === tab.id 
                ? "bg-white text-[#0a2540] shadow-sm border border-slate-200" 
                : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        {activeTab === "applicant" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-black text-[#0a2540] flex items-center gap-2">
              <Users size={24} className="text-[#d4af37]" /> Applicant Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoCard label="Full Name" value={fileData.fullName} />
              <InfoCard label="Mobile" value={fileData.phone} />
              <InfoCard label="Email" value={fileData.email} />
              <InfoCard label="CIBIL Score (Reported)" value={fileData.cibilScore} />
              <InfoCard label="Requested Loan Amount" value={`₹ ${fileData.loanAmount}`} />
              <InfoCard label="Loan Type" value={fileData.loanType} />
              <InfoCard label="Employment Type" value={fileData.eligibility?.employmentType} />
              <InfoCard label="Company/Business" value={fileData.eligibility?.companyName || fileData.eligibility?.businessName || fileData.eligibility?.govDepartment || "N/A"} />
              <InfoCard label="Annual Turnover/Income" value={fileData.eligibility?.annualTurnover || fileData.eligibility?.income || "N/A"} />
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-black text-[#0a2540] flex items-center gap-2">
              <FileImage size={24} className="text-[#d4af37]" /> Document Verification
            </h2>
            {(!fileData.documents || Object.keys(fileData.documents).filter(k => fileData.documents[k] && fileData.documents[k].path).length === 0) ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-sm font-bold text-slate-500">No documents uploaded.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(fileData.documents)
                  .filter(([key, doc]) => doc && doc.path)
                  .map(([key, doc], idx) => (
                  <div key={idx} className="flex flex-col p-5 border border-slate-200 bg-white shadow-sm rounded-2xl hover:border-slate-300 transition">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-slate-100 text-[#0a2540] p-3 rounded-xl">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#0a2540] truncate">{doc.name || key}</p>
                        <a href={`${(api.defaults.baseURL || 'http://localhost:5000/api').replace('/api', '')}/uploads/${doc.path.split('\\').pop().split('/').pop()}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 mt-1 w-max">
                          <Download size={14}/> View File
                        </a>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Verification Status</p>
                      <div className="flex bg-slate-50 p-1 rounded-xl">
                        <button 
                          onClick={() => handleDocVerifyChange(key, 'Verified')}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition ${docsVerification[key] === 'Verified' ? 'bg-green-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                        >Verified</button>
                        <button 
                          onClick={() => handleDocVerifyChange(key, 'Pending')}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition ${(!docsVerification[key] || docsVerification[key] === 'Pending') ? 'bg-orange-400 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                        >Pending</button>
                        <button 
                          onClick={() => handleDocVerifyChange(key, 'Rejected')}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition ${docsVerification[key] === 'Rejected' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                        >Rejected</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-4">
              <button onClick={handleSaveDetails} disabled={saving} className="bg-[#0a2540] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#d4af37] transition flex items-center gap-2">
                <Save size={18} /> {saving ? "Saving..." : "Save Verifications"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "credit" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-black text-[#0a2540] flex items-center gap-2">
                  <FileText size={24} className="text-[#d4af37]" /> Internal Credit Analysis
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Verified CIBIL Score</label>
                    <input type="number" name="verifiedCibil" value={creditDetails.verifiedCibil || ""} onChange={handleDetailChange} className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-[#0a2540] focus:border-transparent outline-none transition shadow-sm" placeholder="e.g. 750" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Monthly Income (₹)</label>
                    <input type="number" name="monthlyIncome" value={creditDetails.monthlyIncome || ""} className="w-full border border-slate-300 rounded-xl p-3 text-sm font-semibold outline-none transition shadow-sm bg-slate-100" placeholder="e.g. 50000" readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Existing EMI (₹)</label>
                    <input type="number" name="existingEmi" value={creditDetails.existingEmi || ""} className="w-full border border-slate-300 rounded-xl p-3 text-sm font-semibold outline-none transition shadow-sm bg-slate-100" placeholder="e.g. 10000" readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">FOIR (%)</label>
                    <input type="number" name="foir" value={creditDetails.foir || ""} className="w-full border border-slate-300 rounded-xl p-3 text-sm font-semibold outline-none transition shadow-sm bg-slate-100" placeholder="Fixed Obligation to Income Ratio" readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Tenure (Months)</label>
                    <input type="number" name="tenure" value={creditDetails.tenure || ""} onChange={handleDetailChange} className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-[#0a2540] focus:border-transparent outline-none transition shadow-sm" placeholder="e.g. 60" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Eligible Loan Amount (₹)</label>
                    <input type="number" name="eligibleAmount" value={creditDetails.eligibleAmount || ""} className="w-full border border-slate-300 rounded-xl p-3 text-sm font-semibold outline-none transition shadow-sm bg-slate-100" placeholder="₹" readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Proposed ROI (%)</label>
                    <input type="number" name="proposedRoi" value={creditDetails.proposedRoi || ""} onChange={handleDetailChange} className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-[#0a2540] focus:border-transparent outline-none transition shadow-sm" placeholder="Rate of Interest" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Underwriter Remarks</label>
                    <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows="3" className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-[#0a2540] focus:border-transparent outline-none transition shadow-sm resize-none" placeholder="Internal notes and rationale..."></textarea>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={handleSaveDetails} disabled={saving} className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-black transition flex items-center gap-2 shadow-sm">
                  <Save size={18} /> {saving ? "Saving..." : "Save Analysis"}
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200">
              <h3 className="text-lg font-black text-[#0a2540] mb-4">Internal Decision</h3>
              <p className="text-sm text-slate-500 mb-6">Approve or reject this application internally before submitting it to a bank.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => handleDecision("Approved")}
                  disabled={saving || fileData.creditStatus === "Approved" || fileData.creditStatus?.includes("Bank")}
                  className="flex-1 bg-emerald-500 text-white font-bold py-4 rounded-2xl hover:bg-emerald-600 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={20} /> Mark as Internally Approved
                </button>
                <button 
                  onClick={() => handleDecision("Rejected")}
                  disabled={saving || fileData.creditStatus === "Rejected"}
                  className="flex-1 bg-red-500 text-white font-bold py-4 rounded-2xl hover:bg-red-600 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle size={20} /> Reject Application
                </button>
              </div>
              {(fileData.creditStatus === "Approved" || fileData.creditStatus?.includes("Bank")) && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800">
                  <CheckCircle size={20} />
                  <div>
                    <p className="font-bold">This file has been internally approved.</p>
                    <p className="text-sm opacity-80">You can now proceed to the Bank Application tab.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "bank" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-black text-[#0a2540] flex items-center gap-2 mb-2">
              <Building2 size={24} className="text-[#d4af37]" /> Bank Submission & Decision
            </h2>
            
            {!(fileData.creditStatus === "Approved" || fileData.creditStatus?.includes("Bank")) ? (
              <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                <div className="bg-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Building2 size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-700 mb-2">Internal Approval Required</h3>
                <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">
                  You must mark this file as "Internally Approved" in the Credit Analysis tab before you can apply to a bank.
                </p>
              </div>
            ) : !bankLinksUnlocked ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto mt-8">
                <h3 className="text-xl font-black text-[#0a2540] mb-4">Client Verification Required</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Before applying to official bank portals, we must verify the client's consent via OTP.
                </p>
                <button 
                  onClick={handleUnlockBanks}
                  className="w-full bg-[#0a2540] text-white py-3 rounded-xl font-bold hover:bg-[#153a61] transition"
                >
                  Unlock Bank Links
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableBanks.map(b => (
                    <a 
                      key={b} 
                      href={BANK_LINKS[b] || "#"} 
                      target="_blank" 
                      rel="noreferrer"
                      className="bg-white border border-slate-200 p-4 rounded-2xl flex justify-between items-center hover:border-[#0a2540] hover:shadow-md transition"
                    >
                      <span className="font-bold text-slate-700">{b} Application Portal</span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold">Verified</span>
                    </a>
                  ))}
                </div>

                <form onSubmit={handleBankSubmit} className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-200 shadow-inner mt-8">
                  <h3 className="text-lg font-black text-[#0a2540] mb-6 border-b border-slate-200 pb-2">Record Bank Decision</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-[#0a2540] mb-2">Select Bank</label>
                        <select 
                          value={bankApplied}
                          onChange={(e) => setBankApplied(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-[#0a2540] outline-none shadow-sm cursor-pointer"
                        >
                          <option value="">-- Choose a Bank --</option>
                          {availableBanks.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                    <div>
                      <label className="block text-sm font-bold text-[#0a2540] mb-2">Bank Application Status</label>
                      <select 
                        value={bankApplicationStatus}
                        onChange={(e) => setBankApplicationStatus(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-[#0a2540] outline-none shadow-sm cursor-pointer"
                      >
                        <option value="Pending">Pending Decision</option>
                        <option value="Approved">Approved by Bank</option>
                        <option value="Rejected">Rejected by Bank</option>
                      </select>
                    </div>

                    {bankApplicationStatus === "Approved" && (
                      <div className="animate-in slide-in-from-top-2">
                        <label className="block text-sm font-bold text-[#0a2540] mb-2">Final Sanctioned Amount (₹)</label>
                        <input 
                          type="number" 
                          value={bankSanctionedAmount}
                          onChange={(e) => setBankSanctionedAmount(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-[#0a2540] outline-none shadow-sm"
                          placeholder="Amount approved by bank"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-[#0a2540] mb-2">Upload Sanction/Proof Document</label>
                      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 bg-white text-center hover:bg-slate-50 transition cursor-pointer relative">
                        <input 
                          type="file" 
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => setBankProofFile(e.target.files[0])}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="pointer-events-none flex flex-col items-center">
                          <div className="bg-[#0a2540]/10 text-[#0a2540] p-3 rounded-full mb-3">
                            <Upload size={24} />
                          </div>
                          <p className="font-bold text-[#0a2540] text-sm mb-1">
                            {bankProofFile ? bankProofFile.name : "Click to upload or drag & drop"}
                          </p>
                          <p className="text-xs text-slate-500 font-medium">PDF, JPG, PNG up to 10MB</p>
                        </div>
                      </div>
                      
                      {/* Show existing proof if uploaded */}
                      {fileData.bankSanctionProof && !bankProofFile && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText size={20} className="text-blue-600" />
                            <div>
                              <p className="text-xs font-bold text-blue-900">Current Uploaded Proof:</p>
                              <p className="text-sm font-semibold text-blue-800 truncate max-w-[200px]">{fileData.bankSanctionProof.originalName || fileData.bankSanctionProof.filename}</p>
                            </div>
                          </div>
                          <a 
                            href={`${(api.defaults.baseURL || 'http://localhost:5000/api').replace('/api', '')}/uploads/${fileData.bankSanctionProof.path.split('\\').pop().split('/').pop()}`}
                            target="_blank" rel="noreferrer"
                            className="text-xs font-bold bg-white text-blue-600 px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-600 hover:text-white transition"
                          >
                            View
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
                  <button 
                    type="submit"
                    disabled={submittingBank}
                    className="bg-[#0a2540] text-white px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wide hover:bg-[#d4af37] transition shadow-lg flex items-center gap-2"
                  >
                    {submittingBank ? "Saving..." : "Save Bank Application"}
                  </button>
                </div>
              </form>
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple helper component for displaying info
const InfoCard = ({ label, value }) => (
  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="font-semibold text-slate-800">{value || "N/A"}</p>
  </div>
);
