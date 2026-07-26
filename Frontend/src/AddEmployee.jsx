import React, { useState } from "react";

const ROLES = [
  "Reception / Front Desk",
  "Sales Department",
  "Relationship Manager (RM)",
  "Telecalling / Lead Generation",
  "Credit / Underwriting",
  "Operations Department",
  "Legal Department",
  "Technical / Valuation",
  "KYC & Compliance",
  "Accounts & Finance",
  "Collections & Recovery",
  "Customer Support",
  "Human Resources (HR)",
  "Administration (Admin)",
  "Marketing",
  "IT Department",
  "Insurance Department",
  "Management",
];

export default function AddEmployee({ onAddEmployee }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    role: ROLES[0],
    status: "Active",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      setMessage("કૃપા કરીને નામ, ઈમેલ અને ફોન નંબર ભરો.");
      return;
    }

    if (onAddEmployee) {
      onAddEmployee(form);
    }
    setForm({ name: "", email: "", phone: "", address: "", role: ROLES[0], status: "Active" });
    setMessage("એમ્પ્લોયી સફળતાપૂર્વક ઉમેરાઈ ગયા છે!");
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-md border-t-8 border-t-[#d4af37]">
      <h3 className="text-xl font-black text-[#0a2540] mb-6">Register New Employee</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Rahul Sharma"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37]"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="rahul@mhaveerfincap.com"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37]"
          />
        </div>

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
            placeholder="+91 98765 43210"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37]"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">
            Role *
          </label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#0a2540] outline-none focus:border-[#d4af37]"
          >
            {ROLES.map((r, idx) => (
              <option key={idx} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 mt-2">
          <button
            type="submit"
            className="w-full py-3 bg-[#d4af37] hover:bg-[#c39e2d] text-[#0a2540] font-black rounded-xl shadow-md text-xs uppercase tracking-wider transition"
          >
            Save Employee Profile
          </button>
          {message && <p className="mt-3 text-center text-emerald-600 font-bold">{message}</p>}
        </div>
      </form>
    </div>
  );
}