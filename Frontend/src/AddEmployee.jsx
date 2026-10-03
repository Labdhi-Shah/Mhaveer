import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "./api";
import { Loader2, CheckCircle, Copy, X, Users, Building2, User, Phone, MapPin, Briefcase } from "lucide-react";

const DEPARTMENTS = ["Sales Department", "Telecalling", "Admin", "Account & Fianc", "Marketing", "Manegement", "Human Resorece(HR)", "Collection & Records", "KYC Compliation", "Operations Department", "Customer Support", "Credit"];
const ROLES = ["Manager", "Team Leader", "Employee"];

export default function AddEmployee() {
  const navigate = useNavigate();
  const location = useLocation();
  const editEmpId = location.state?.editEmpId;

  const [form, setForm] = useState({
    fullName: "",
    personalEmail: "",
    phone: "",
    dob: "",
    joiningDate: "",
    role: "",
    department: "",
    address: "",
    status: "Active",
    managerId: "",
    teamLeaderId: "",
    aadhaarNumber: "",
    panNumber: "",
    fatherPhone: "",
    motherPhone: "",
    guardianPhone: "",
    bankName: "",
    ifscCode: "",
    accountNumber: "",
    accountHolderName: "",
  });

  const [managers, setManagers] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdData, setCreatedData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const empRes = await api.get("/employees?limit=1000");
        if (empRes.data?.success) {
          const allEmps = empRes.data.data;
          setManagers(allEmps.filter(e => e.role === "Manager" || e.role === "Management"));
          setTeamLeaders(allEmps.filter(e => e.role === "Team Leader"));
        }
      } catch (err) {
        console.error("Failed to fetch employees", err);
      }
      
      try {
        const bankRes = await api.get("/banks");
        if (bankRes.data) {
          const bankList = bankRes.data.data || bankRes.data || [];
          if (Array.isArray(bankList)) {
            setBanks(bankList);
          }
        }
      } catch (err) {
        console.error("Failed to fetch banks", err);
        setBanks([
          "State Bank of India", 
          "HDFC Bank", 
          "ICICI Bank", 
          "Axis Bank", 
          "Punjab National Bank", 
          "Bank of Baroda",
          "Kotak Mahindra Bank"
        ]);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (editEmpId) {
      const fetchEmp = async () => {
        try {
          const res = await api.get(`/employees/${editEmpId}`);
          if (res.data.success) {
            const data = res.data.data;
            setForm({
              fullName: data.fullName || "",
              personalEmail: data.personalEmail || "",
              phone: data.phone || "",
              dob: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : "",
              joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString().split('T')[0] : "",
              role: data.role || "",
              department: data.department || "",
              address: data.address || "",
              status: data.status || "Active",
              managerId: data.managerId || "",
              teamLeaderId: data.teamLeaderId || "",
              aadhaarNumber: data.aadhaarNumber || "",
              panNumber: data.panNumber || "",
              fatherPhone: data.fatherPhone || "",
              motherPhone: data.motherPhone || "",
              guardianPhone: data.guardianPhone || "",
              bankName: data.bankName || "",
              ifscCode: data.ifscCode || "",
              accountNumber: data.accountNumber || "",
              accountHolderName: data.accountHolderName || "",
            });
          }
        } catch (err) {
          setError("Failed to load employee data for editing.");
        }
      };
      fetchEmp();
    }
  }, [editEmpId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    
    if (name.includes("Phone") || name === "phone" || name === "aadhaarNumber" || name === "accountNumber") {
       finalValue = value.replace(/\D/g, ""); 
    }
    if (name === "panNumber" || name === "ifscCode") {
       finalValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    }

    setForm({ ...form, [name]: finalValue });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.phone || form.phone.length !== 10) newErrors.phone = "Must be exactly 10 digits.";
    if (form.fatherPhone && form.fatherPhone.length !== 10) newErrors.fatherPhone = "Must be 10 digits.";
    if (form.motherPhone && form.motherPhone.length !== 10) newErrors.motherPhone = "Must be 10 digits.";
    if (form.guardianPhone && form.guardianPhone.length !== 10) newErrors.guardianPhone = "Must be 10 digits.";
    
    if (form.aadhaarNumber && form.aadhaarNumber.length !== 12) newErrors.aadhaarNumber = "Aadhaar must be exactly 12 digits.";
    if (form.panNumber && form.panNumber.length !== 10) newErrors.panNumber = "PAN must be exactly 10 characters.";
    if (form.ifscCode && form.ifscCode.length !== 11) newErrors.ifscCode = "IFSC must be exactly 11 characters.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateClick = (e) => {
    if (e.target.showPicker) {
      e.target.showPicker();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.department) return setError("Please select a department.");
    if (!form.role) return setError("Please select a role.");
    if (!validateForm()) return setError("Please correct the highlighted field errors.");

    setLoading(true);
    setError("");

    try {
      const payload = { ...form, dateOfBirth: form.dob };
      
      if (editEmpId) {
        const response = await api.put(`/employees/${editEmpId}`, payload);
        if (response.data.success) {
          navigate("/telecalling/employees", { state: { refresh: true } }); 
        }
      } else {
        const response = await api.post("/employees", payload);
        if (response.data.success) {
          setCreatedData(response.data.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save employee profile.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (createdData?.temporaryPassword) {
      navigator.clipboard.writeText(createdData.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const SectionHeader = ({ title, icon: Icon }) => (
    <div className="md:col-span-2 flex items-center gap-2 mt-6 mb-2 pb-2 border-b border-slate-200">
      <div className="p-1.5 bg-slate-100 rounded-lg text-[#0a2540]">
        <Icon size={16} />
      </div>
      <h4 className="text-sm font-black text-[#0a2540] uppercase tracking-wider">{title}</h4>
    </div>
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-8 shadow-sm border-t-8 border-t-[#d4af37]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-black text-[#0a2540]">
          {editEmpId ? "Edit Employee Profile" : "Register New Employee"}
        </h3>
        <button
          type="button"
          onClick={() => navigate("/telecalling/employees")}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#0a2540] px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Users size={16} />
          <span>View Employee List</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        
        {/* --- PROFESSIONAL DETAILS --- */}
        <SectionHeader title="Professional Details" icon={Briefcase} />
        
        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">Department *</label>
          <select name="department" value={form.department} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] font-bold cursor-pointer">
            <option value="" disabled>-- Select Department --</option>
            {DEPARTMENTS.map((dept, idx) => (<option key={idx} value={dept}>{dept}</option>))}
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">Role *</label>
          <select name="role" value={form.role} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] font-bold cursor-pointer">
            <option value="" disabled>-- Select Role --</option>
            {ROLES.map((r, idx) => (<option key={idx} value={r}>{r}</option>))}
          </select>
        </div>

        {form.role && form.role !== "Manager" && (
          <div>
            <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">Assign Manager</label>
            <select name="managerId" value={form.managerId} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] font-bold cursor-pointer">
              <option value="">-- No Manager --</option>
              {managers.filter(m => !form.department || m.department === form.department).map(m => (
                <option key={m._id} value={m._id}>{m.fullName} ({m.employeeId})</option>
              ))}
            </select>
          </div>
        )}

        {form.role && form.role === "Employee" && (
          <div>
            <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">Assign Team Leader</label>
            <select name="teamLeaderId" value={form.teamLeaderId} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] font-bold cursor-pointer">
              <option value="">-- No Team Leader --</option>
              {teamLeaders.filter(tl => !form.department || tl.department === form.department).map(tl => (
                <option key={tl._id} value={tl._id}>{tl.fullName} ({tl.employeeId})</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">Status *</label>
          <select name="status" value={form.status} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] cursor-pointer">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        
        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">Joining Date *</label>
          <input type="date" name="joiningDate" required value={form.joiningDate} onChange={handleChange} onClick={handleDateClick} className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] cursor-pointer" />
        </div>

        {/* --- PERSONAL & IDENTIFICATION DETAILS --- */}
        <SectionHeader title="Personal & ID Details" icon={User} />
        
        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">Full Name *</label>
          <input type="text" name="fullName" required value={form.fullName} onChange={handleChange} placeholder="e.g. Rahul Sharma" className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37]" />
        </div>

        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">Date of Birth (DOB) *</label>
          <input type="date" name="dob" required value={form.dob} onChange={handleChange} onClick={handleDateClick} className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] cursor-pointer" />
        </div>

        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">Personal Email *</label>
          <input type="email" name="personalEmail" required value={form.personalEmail} onChange={handleChange} placeholder="Email Address" className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37]" />
        </div>

        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">Phone Number *</label>
          <input type="tel" name="phone" required maxLength={10} value={form.phone} onChange={handleChange} placeholder="10 digit number" className={`w-full px-4 py-2.5 bg-slate-100/70 border rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] ${errors.phone ? 'border-rose-500' : 'border-slate-300'}`} />
          {errors.phone && <p className="text-rose-500 text-[10px] mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">Aadhaar Card Number</label>
          <input type="text" name="aadhaarNumber" maxLength={12} value={form.aadhaarNumber} onChange={handleChange} placeholder="12 digit Aadhaar" className={`w-full px-4 py-2.5 bg-slate-100/70 border rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] ${errors.aadhaarNumber ? 'border-rose-500' : 'border-slate-300'}`} />
          {errors.aadhaarNumber && <p className="text-rose-500 text-[10px] mt-1">{errors.aadhaarNumber}</p>}
        </div>

        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">PAN Card Number</label>
          <input type="text" name="panNumber" maxLength={10} value={form.panNumber} onChange={handleChange} placeholder="10 char PAN" className={`w-full px-4 py-2.5 bg-slate-100/70 border rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] ${errors.panNumber ? 'border-rose-500' : 'border-slate-300'}`} />
          {errors.panNumber && <p className="text-rose-500 text-[10px] mt-1">{errors.panNumber}</p>}
        </div>

        {/* --- BANK DETAILS --- */}
        <SectionHeader title="Bank Details" icon={Building2} />

        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">Bank Name</label>
          <select name="bankName" value={form.bankName} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] font-bold cursor-pointer">
            <option value="">-- Select Bank --</option>
            {banks.map((b, idx) => {
              const bankVal = typeof b === 'string' ? b : (b.name || b.bankName || JSON.stringify(b));
              return <option key={idx} value={bankVal}>{bankVal}</option>;
            })}
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">Account Holder Name</label>
          <input type="text" name="accountHolderName" value={form.accountHolderName} onChange={handleChange} placeholder="Name as per bank" className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37]" />
        </div>

        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">Account Number</label>
          <input type="text" name="accountNumber" value={form.accountNumber} onChange={handleChange} placeholder="Bank Account Number" className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37]" />
        </div>

        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">IFSC Code</label>
          <input type="text" name="ifscCode" maxLength={11} value={form.ifscCode} onChange={handleChange} placeholder="11 char IFSC" className={`w-full px-4 py-2.5 bg-slate-100/70 border rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] ${errors.ifscCode ? 'border-rose-500' : 'border-slate-300'}`} />
          {errors.ifscCode && <p className="text-rose-500 text-[10px] mt-1">{errors.ifscCode}</p>}
        </div>

        {/* --- FAMILY / EMERGENCY CONTACT --- */}
        <SectionHeader title="Family / Emergency Contacts" icon={Phone} />

        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">Father's Phone</label>
          <input type="tel" name="fatherPhone" maxLength={10} value={form.fatherPhone} onChange={handleChange} placeholder="10 digit number" className={`w-full px-4 py-2.5 bg-slate-100/70 border rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] ${errors.fatherPhone ? 'border-rose-500' : 'border-slate-300'}`} />
          {errors.fatherPhone && <p className="text-rose-500 text-[10px] mt-1">{errors.fatherPhone}</p>}
        </div>

        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">Mother's Phone</label>
          <input type="tel" name="motherPhone" maxLength={10} value={form.motherPhone} onChange={handleChange} placeholder="10 digit number" className={`w-full px-4 py-2.5 bg-slate-100/70 border rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] ${errors.motherPhone ? 'border-rose-500' : 'border-slate-300'}`} />
          {errors.motherPhone && <p className="text-rose-500 text-[10px] mt-1">{errors.motherPhone}</p>}
        </div>

        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">Guardian's Phone</label>
          <input type="tel" name="guardianPhone" maxLength={10} value={form.guardianPhone} onChange={handleChange} placeholder="10 digit number" className={`w-full px-4 py-2.5 bg-slate-100/70 border rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] ${errors.guardianPhone ? 'border-rose-500' : 'border-slate-300'}`} />
          {errors.guardianPhone && <p className="text-rose-500 text-[10px] mt-1">{errors.guardianPhone}</p>}
        </div>

        {/* --- ADDRESS DETAILS --- */}
        <SectionHeader title="Address Details" icon={MapPin} />

        <div className="md:col-span-2">
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">Full Address</label>
          <textarea name="address" value={form.address} onChange={handleChange} placeholder="House No, Street, Area, City, State, PIN" rows={2} className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] resize-none" />
        </div>

        {/* Submit Button */}
        <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-100">
          <button type="submit" disabled={loading} className="w-full py-3 bg-[#0a2540] hover:bg-[#12385c] text-[#d4af37] font-black rounded-xl shadow-md text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70">
            {loading ? <Loader2 className="animate-spin" size={16} /> : (editEmpId ? "Save Changes" : "Register Employee")}
          </button>
        </div>
      </form>

      {/* SUCCESS MODAL (Only for Create) */}
      {createdData && !editEmpId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-t-8 border-t-emerald-500 relative">
            <button onClick={() => setCreatedData(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={20} />
            </button>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-lg font-black text-[#0a2540]">Employee Created Successfully!</h3>
              <p className="text-xs text-slate-500">
                Generated credentials below for the new employee. Please copy and share them securely.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3 mt-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Employee ID (Generated)</span>
                  <p className="text-sm font-mono font-black text-[#0a2540]">{createdData.employeeId}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Official Email (Generated)</span>
                  <p className="text-sm font-mono font-black text-[#0a2540]">{createdData.email}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Temporary Password (Generated)</span>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-base font-mono font-black text-amber-600">{createdData.temporaryPassword}</p>
                    <button onClick={copyToClipboard} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 transition flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                      <Copy size={12} /> {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => { setCreatedData(null); setForm({ fullName: "", personalEmail: "", phone: "", dob: "", joiningDate: "", role: "", department: "", address: "", status: "Active", managerId: "", teamLeaderId: "", aadhaarNumber: "", panNumber: "", fatherPhone: "", motherPhone: "", guardianPhone: "", bankName: "", ifscCode: "", accountNumber: "", accountHolderName: ""}); }} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase cursor-pointer transition">
                  Add Another
                </button>
                <button type="button" onClick={() => { setCreatedData(null); navigate("/telecalling/employees"); }} className="flex-1 py-2.5 bg-[#0a2540] hover:bg-[#12385c] text-[#d4af37] font-bold rounded-xl text-xs uppercase cursor-pointer transition">
                  View Directory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}