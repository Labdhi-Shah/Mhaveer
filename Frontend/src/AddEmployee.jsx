import { useState } from "react";
import api from "./api";
import { Loader2, CheckCircle, Copy, X } from "lucide-react";

// 18 Main Roles with their Responsibilities
const ROLE_DATA = {
  "Reception / Front Desk": [
    "Visitor management",
    "Call handling",
    "Document collection"
  ],
  "Sales Department": [
    "Generate leads",
    "Meet customers",
    "Explain loan products",
    "Achieve sales targets"
  ],
  "Relationship Manager (RM)": [
    "Customer relationship management",
    "Cross-selling loans and insurance",
    "Follow-ups"
  ],
  "Telecalling / Lead Generation": [
    "Cold calling",
    "Appointment scheduling",
    "Lead qualification"
  ],
  "Credit / Underwriting": [
    "Income assessment",
    "CIBIL check",
    "Document verification",
    "Loan eligibility analysis"
  ],
  "Operations Department": [
    "Loan file processing",
    "Documentation",
    "Disbursement coordination"
  ],
  "Legal Department": [
    "Legal document verification",
    "Property legal checks (secured loans)",
    "Agreement preparation"
  ],
  "Technical / Valuation": [
    "Property inspection",
    "Property valuation",
    "Technical reports"
  ],
  "KYC & Compliance": [
    "Aadhaar/PAN verification",
    "AML compliance",
    "Regulatory compliance"
  ],
  "Accounts & Finance": [
    "Payments",
    "Vendor management",
    "Commission payout",
    "GST and bookkeeping"
  ],
  "Collections & Recovery": [
    "EMI follow-up",
    "Recovery of overdue payments",
    "NPA management"
  ],
  "Customer Support": [
    "Resolve customer queries",
    "Complaint handling",
    "Service requests"
  ],
  "Human Resources (HR)": [
    "Recruitment",
    "Attendance",
    "Payroll",
    "Employee training"
  ],
  "Administration (Admin)": [
    "Office management",
    "Asset management",
    "Stationery and facilities"
  ],
  "Marketing": [
    "Digital marketing",
    "Social media",
    "Campaigns",
    "Brand promotion"
  ],
  "IT Department": [
    "CRM management",
    "System maintenance",
    "User support",
    "Data backup and security"
  ],
  "Insurance Department": [
    "Life insurance",
    "Health insurance",
    "General insurance",
    "Policy servicing"
  ],
  "Management": [
    "Branch Manager",
    "Operations Manager",
    "Regional Manager",
    "Director / CEO"
  ]
};

const ROLES = Object.keys(ROLE_DATA);

export default function AddEmployee() {
  const [form, setForm] = useState({
    fullName: "",
    personalEmail: "",
    phone: "",
    dob: "", // Date of Birth
    joiningDate: "", // Joining Date
    role: "", 
    address: "",
    status: "Active",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdData, setCreatedData] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDateClick = (e) => {
    if (e.target.showPicker) {
      e.target.showPicker();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role) {
      setError("Please select a role / department.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        dateOfBirth: form.dob,
      };
      const response = await api.post("/employees", payload);
      if (response.data.success) {
        setCreatedData(response.data.data);
        setForm({
          fullName: "",
          personalEmail: "",
          phone: "",
          dob: "",
          joiningDate: "",
          role: "",
          address: "",
          status: "Active",
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create employee.");
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

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm border-t-8 border-t-[#d4af37]">
      <h3 className="text-xl font-black text-[#0a2540] mb-6">Register New Employee</h3>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        {/* Full Name */}
        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">
            Full Name *
          </label>
          <input
            type="text"
            name="fullName"
            required
            value={form.fullName}
            onChange={handleChange}
            placeholder="e.g. Rahul Sharma"
            className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37]"
          />
        </div>

        {/* Personal Email Address */}
        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">
            Personal Email *
          </label>
          <input
            type="email"
            name="personalEmail"
            required
            value={form.personalEmail}
            onChange={handleChange}
            placeholder="rahul@gmail.com"
            className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37]"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            name="phone"
            required
            value={form.phone}
            onChange={handleChange}
            placeholder="9876543210"
            className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37]"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">
            Status *
          </label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] cursor-pointer"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Date of Birth (DOB) */}
        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">
            Date of Birth (DOB) *
          </label>
          <input
            type="date"
            name="dob"
            required
            value={form.dob}
            onChange={handleChange}
            onClick={handleDateClick}
            className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] cursor-pointer"
          />
        </div>

        {/* Joining Date */}
        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">
            Joining Date *
          </label>
          <input
            type="date"
            name="joiningDate"
            required
            value={form.joiningDate}
            onChange={handleChange}
            onClick={handleDateClick}
            className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] cursor-pointer"
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">
            Address
          </label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="123 Main St, City"
            className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37]"
          />
        </div>

        {/* Role Selection Dropdown */}
        <div className="md:col-span-2">
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">
            Role / Department *
          </label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37] font-bold cursor-pointer"
          >
            <option value="" disabled>-- Select Role / Department --</option>
            {ROLES.map((r, idx) => (
              <option key={idx} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* RESPONSIBILITIES - Appears ONLY AFTER selecting a role */}
          {form.role && ROLE_DATA[form.role] && (
            <div className="mt-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 transition-all">
              <p className="text-[11px] font-extrabold uppercase text-[#0a2540] mb-2.5">
                Key Responsibilities ({form.role}):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 text-xs">
                {ROLE_DATA[form.role].map((item, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-[#d4af37] shrink-0" />
                    <span className="font-semibold text-slate-800">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="md:col-span-2 mt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0a2540] hover:bg-[#12385c] text-[#d4af37] font-black rounded-xl shadow-md text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Save Employee Profile"}
          </button>
        </div>
      </form>

      {/* SUCCESS MODAL */}
      {createdData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-t-8 border-t-emerald-500 relative">
            <button
              onClick={() => setCreatedData(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
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
                  <p className="text-sm font-mono font-black text-[#0a2540]">
                    {createdData.employeeId}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Official Email (Generated)</span>
                  <p className="text-sm font-mono font-black text-[#0a2540]">
                    {createdData.email}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Temporary Password (Generated)
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-base font-mono font-black text-amber-600">
                      {createdData.temporaryPassword}
                    </p>
                    <button
                      onClick={copyToClipboard}
                      className="p-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 transition flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                    >
                      <Copy size={12} /> {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCreatedData(null)}
                className="w-full mt-4 py-2.5 bg-[#0a2540] text-white font-bold rounded-xl text-xs uppercase cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}