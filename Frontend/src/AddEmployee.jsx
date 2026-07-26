import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

const roles = [
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

function generateEmployeeId(existingEmployees) {
  const nextNumber = existingEmployees.length + 1;
  return `EMP${String(nextNumber).padStart(4, "0")}`;
}

function generatePassword() {
  const letters = "MHV";
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return `${letters}${digits}`;
}

export default function AddEmployee({ employees, onAddEmployee }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: roles[0],
    joiningDate: "",
    dob: "",
    address: "",
  });
  const [feedback, setFeedback] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const employeeId = generateEmployeeId(employees);
    const tempPassword = generatePassword();

    const newEmployee = {
      id: employeeId,
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      role: form.role,
      department: form.role,
      status: "Active",
      createdAt: new Date().toISOString(),
      password: tempPassword,
      joiningDate: form.joiningDate,
      dob: form.dob,
      address: form.address,
    };

    onAddEmployee(newEmployee);
    setFeedback({ employeeId, tempPassword });
    setForm({
      fullName: "",
      email: "",
      phone: "",
      role: roles[0],
      joiningDate: "",
      dob: "",
      address: "",
    });
  };

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/20">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.26em] text-indigo-300">Onboarding</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Add New Employee</h2>
          <p className="mt-2 text-sm text-slate-400">Create a staff profile instantly with automatic credential generation and a polished admin experience.</p>
        </div>

        <form className="mt-6 grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Full Name</span>
            <input name="fullName" value={form.fullName} onChange={handleChange} required className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500/60" placeholder="Asha Kumar" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Email Address</span>
            <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500/60" placeholder="employee@example.com" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Phone Number</span>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} required className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500/60" placeholder="+91 98765 43210" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Role</span>
            <select name="role" value={form.role} onChange={handleChange} required className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500/60">
              {roles.map((role) => (
                <option key={role} value={role} className="bg-slate-900 text-white">
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Joining Date</span>
            <input type="date" name="joiningDate" value={form.joiningDate} onChange={handleChange} max={today} required className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500/60" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Date of Birth</span>
            <input type="date" name="dob" value={form.dob} onChange={handleChange} max={today} required className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500/60" />
          </label>

          <label className="block lg:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-300">Address</span>
            <textarea name="address" value={form.address} onChange={handleChange} required rows="3" className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500/60" placeholder="House No., Street, City, State" />
          </label>

          <div className="lg:col-span-2">
            <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500">
              <Sparkles className="h-4 w-4" />
              Create Employee
            </button>
          </div>
        </form>
      </div>

      {feedback ? (
        <div className="rounded-[28px] border border-emerald-400/20 bg-emerald-500/10 p-6 shadow-2xl shadow-emerald-950/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
            <div>
              <p className="text-lg font-semibold text-white">Employee created successfully</p>
              <p className="mt-2 text-sm text-emerald-200">
                Employee ID: <span className="font-semibold">{feedback.employeeId}</span>
              </p>
              <p className="mt-1 text-sm text-emerald-200">
                Temporary Password: <span className="font-semibold">{feedback.tempPassword}</span>
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
