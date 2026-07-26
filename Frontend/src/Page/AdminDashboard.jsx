import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BarChart2, CreditCard, FileText, MessageCircle, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ROLES = [
  {
    title: "Reception / Front Desk",
    tasks: ["Visitor management", "Call handling", "Document collection"],
  },
  {
    title: "Sales Department",
    tasks: ["Generate leads", "Meet customers", "Explain loan products", "Achieve sales targets"],
  },
  {
    title: "Relationship Manager (RM)",
    tasks: ["Customer relationship management", "Cross-selling loans and insurance", "Follow-ups"],
  },
  {
    title: "Telecalling / Lead Generation",
    tasks: ["Cold calling", "Appointment scheduling", "Lead qualification"],
  },
  { 
    title: "Credit / Underwriting",
    tasks: ["Income assessment", "CIBIL check", "Document verification", "Loan eligibility analysis"],
  },
  {
    title: "Operations Department",
    tasks: ["Loan file processing", "Documentation", "Disbursement coordination"],
  },
  {
    title: "Legal Department",
    tasks: ["Legal document verification", "Property legal checks (secured loans)", "Agreement preparation"],
  },
  {
    title: "Technical / Valuation",
    tasks: ["Property inspection", "Property valuation", "Technical reports"],
  },
  {
    title: "KYC & Compliance",
    tasks: ["Aadhaar/PAN verification", "AML compliance", "Regulatory compliance"],
  },
  {
    title: "Accounts & Finance",
    tasks: ["Payments", "Vendor management", "Commission payout", "GST and bookkeeping"],
  },
  {
    title: "Collections & Recovery",
    tasks: ["EMI follow-up", "Recovery of overdue payments", "NPA management"],
  },
  {
    title: "Customer Support",
    tasks: ["Resolve customer queries", "Complaint handling", "Service requests"],
  },
  {
    title: "Human Resources (HR)",
    tasks: ["Recruitment", "Attendance", "Payroll", "Employee training"],
  },
  {
    title: "Administration (Admin)",
    tasks: ["Office management", "Asset management", "Stationery and facilities"],
  },
  {
    title: "Marketing",
    tasks: ["Digital marketing", "Social media", "Campaigns", "Brand promotion"],
  },
  {
    title: "IT Department",
    tasks: ["CRM management", "System maintenance", "User support", "Data backup and security"],
  },
  {
    title: "Insurance Department",
    tasks: ["Life insurance", "Health insurance", "General insurance", "Policy servicing"],
  },
  {
    title: "Management",
    tasks: ["Branch Manager", "Operations Manager", "Regional Manager", "Director / CEO"],
  },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    role: ROLES[0].title,
    status: "Active",
  });
  const [message, setMessage] = useState("");
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const stats = useMemo(
    () => ({
      totalEmployees: employees.length,
      active: employees.filter((emp) => emp.status === "Active").length,
      pending: employees.filter((emp) => emp.status === "Pending").length,
      withPhone: employees.filter((emp) => emp.phone).length,
    }),
    [employees]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (name === "role") {
      const roleInfo = ROLES.find((role) => role.title === value);
      if (roleInfo) {
        setSelectedRole(roleInfo);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      setMessage("Please complete Name, Email, and Phone.");
      return;
    }

    const nextEmployee = {
      id: `EMP-${Date.now()}`,
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      role: form.role || ROLES[0].title,
      status: form.status || "Active",
      createdAt: new Date().toLocaleDateString(),
    };

    setEmployees((current) => [nextEmployee, ...current]);
    setForm({ name: "", email: "", phone: "", address: "", role: ROLES[0].title, status: "Active" });
    setMessage("Employee added successfully.");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#07132b] font-sans text-slate-200">
      <header className="flex flex-col gap-4 px-6 py-7 md:flex-row md:items-center md:justify-between bg-[#08245b] text-white shadow-soft">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-[#d4af37]">Admin Panel</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-200">Signed in admin view with employee management and quick stats.</p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center justify-center rounded-2xl bg-[#d4af37] px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#0b2746] transition hover:bg-[#bea34d]"
        >
          Logout
        </button>
      </header>

      <main className="px-6 py-8">
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 mb-8">
          {[
            { label: "Total Employees", value: stats.totalEmployees },
            { label: "Active", value: stats.active },
            { label: "Pending", value: stats.pending },
            { label: "With Phone", value: stats.withPhone },
          ].map((item, idx) => (
            <article key={item.label} className="rounded-[18px] bg-white p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#08245b]">{item.label}</p>
                  <p className="mt-2 text-2xl font-extrabold text-[#08245b]">{item.value}</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="h-12 w-12 rounded-full bg-[#08245b] flex items-center justify-center text-white">
                    {idx === 0 ? "👥" : idx === 1 ? "✔️" : idx === 2 ? "⏳" : "📞"}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-emerald-600">+{(idx + 8).toFixed(1)}%</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[2fr_1fr] mb-8">
          <div className="rounded-[28px] bg-white p-6 shadow-xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#d4af37]">Business Overview</p>
                <h2 className="mt-2 text-2xl font-black text-[#08245b]">Performance Snapshot</h2>
              </div>
              <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-[#071a2b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#102f5f]">
                <ArrowUpRight className="h-4 w-4" />
                View Trends
              </button>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_auto]">
              <div className="rounded-[24px] bg-[#071a2b] p-5 text-slate-200 shadow-inner">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span className="inline-flex items-center gap-2 text-white">
                    <span className="h-2 w-2 rounded-full bg-[#2d6bf6]" /> Assets
                  </span>
                  <span className="inline-flex items-center gap-2 text-white">
                    <span className="h-2 w-2 rounded-full bg-[#d4af37]" /> Investments
                  </span>
                </div>
                <div className="mt-6 h-[320px] rounded-[24px] bg-[#0b2746] p-4">
                  <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-gradient-to-b from-white/5 to-transparent">
                    <div className="absolute left-0 right-0 top-0 bottom-0 bg-[linear-gradient(90deg,transparent_calc(40%_-_1px),rgba(255,255,255,0.08)_calc(40%_-_1px),rgba(255,255,255,0.08)_calc(40%_+_1px),transparent_calc(40%_+_1px))]" />
                    <div className="absolute inset-0 grid grid-cols-10 gap-4 px-2 py-4">
                      {Array.from({ length: 10 }).map((_, idx) => (
                        <div key={idx} className="relative flex flex-col justify-end">
                          <span className={`mx-auto block h-${[14,18,15,22,16,24,20,26,19,28][idx]} w-2 rounded-full bg-white/60`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] bg-[#f8fafc] p-6 text-[#08245b] shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.35em]">Asset Allocation</p>
                  <span className="text-sm text-slate-500">This Month</span>
                </div>
                <div className="mt-6 flex flex-col items-center gap-4">
                  <div className="relative flex h-48 w-48 items-center justify-center rounded-full bg-[#e7f0ff] shadow-inner">
                    <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_90deg,_#2d6bf6_0%,_#2d6bf6_30%,_#d4af37_30%,_#d4af37_60%,_#4f7dd4_60%,_#4f7dd4_80%,_#c1c5cd_80%,_#c1c5cd_100%)]" />
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white text-center">
                      <div>
                        <p className="text-2xl font-black text-[#08245b]">2.45 Cr</p>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Total Assets</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid w-full gap-3">
                    {[
                      { label: 'Mutual Funds', value: '40%', color: '#2d6bf6' },
                      { label: 'Fixed Deposits', value: '30%', color: '#d4af37' },
                      { label: 'Stocks', value: '20%', color: '#4f7dd4' },
                      { label: 'Others', value: '10%', color: '#c1c5cd' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3 text-sm">
                        <span className="inline-flex items-center gap-2 text-[#08245b]">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.label}
                        </span>
                        <span className="font-semibold text-[#08245b]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-6">
            <div className="rounded-[28px] bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#08245b]">Quick Actions</h3>
                <span className="text-sm text-slate-500">4 actions</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Add Customer', icon: UserPlus },
                  { label: 'New Investment', icon: CreditCard },
                  { label: 'Disburse Loan', icon: ArrowUpRight },
                  { label: 'Generate Report', icon: FileText },
                  { label: 'Send Message', icon: MessageCircle },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <button key={action.label} className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-[#f8fafc] px-4 py-4 text-left text-sm font-medium text-[#08245b] transition hover:bg-[#eef2f7]">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#08245b] text-white">
                        <Icon className="h-5 w-5" />
                      </span>
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="rounded-[28px] bg-[#071a2b] p-6 shadow-xl">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Add Employee</h3>
                  <p className="mt-2 text-sm text-slate-400">Create new employee profiles quickly with the form below.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmployeeForm((current) => !current)}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#0b2746] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#102f5f]"
                >
                  {showEmployeeForm ? "Hide Form" : "Add Employee"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-[28px] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#08245b]">Recent Transactions</h3>
              <a className="text-sm font-semibold text-[#d4af37]">View All</a>
            </div>

            <ul className="mt-4 space-y-4">
              {[
                { title: "Investment in Mutual Fund", id: "INV125689", amount: "₹ 50,000", date: "28 May 2025", status: "Completed" },
                { title: "Loan Disbursed", id: "LN125688", amount: "₹ 2,00,000", date: "27 May 2025", status: "Completed" },
                { title: "Fixed Deposit", id: "FD125687", amount: "₹ 1,00,000", date: "26 May 2025", status: "Completed" },
                { title: "Loan Repayment", id: "LN125686", amount: "₹ 75,000", date: "25 May 2025", status: "Completed" },
              ].map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
                  <div>
                    <p className="text-sm font-semibold text-[#08245b]">{t.title}</p>
                    <p className="mt-1 text-xs text-slate-500">ID: {t.id} • {t.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">{t.amount}</p>
                    <span className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">{t.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <aside className="rounded-[28px] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#08245b]">Quick Actions</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: 'Add Customer', icon: UserPlus },
                { label: 'New Investment', icon: CreditCard },
                { label: 'Disburse Loan', icon: ArrowUpRight },
                { label: 'Generate Report', icon: FileText },
                { label: 'Send Message', icon: MessageCircle },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button key={action.label} className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-[#f8fafc] px-3 py-4 text-sm font-medium text-[#08245b] transition hover:bg-[#eef2f7]">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#08245b] text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>
        </section>

        {showEmployeeForm && (
          <section className="mt-8 rounded-[28px] bg-[#071a2b] p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
              {[
                { name: 'name', label: 'Name', type: 'text' },
                { name: 'email', label: 'Email', type: 'email' },
                { name: 'phone', label: 'Phone', type: 'text' },
                { name: 'address', label: 'Address', type: 'text' },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">{field.label}</label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-700 bg-[#071a2b] px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Role</label>
                <div className="rounded-2xl border border-slate-700 bg-[#071a2b] px-4 py-3 text-sm text-slate-200">{form.role}</div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-700 bg-[#071a2b] px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="lg:col-span-2">
                <button type="submit" className="w-full rounded-2xl bg-[#0b2746] px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#102f5f]">
                  Create Employee
                </button>
                {message && <p className="mt-4 text-sm font-medium text-emerald-600">{message}</p>}
              </div>
            </form>
          </section>
        )}
      </main>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-[20px] bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#08245b]">Recent Transactions</h3>
              <a className="text-sm font-medium text-[#d4af37]">View All</a>
            </div>

            <ul className="mt-4 space-y-4">
              {[
                { title: "Investment in Mutual Fund", id: "INV125689", amount: "₹ 50,000", date: "28 May 2025", status: "Completed" },
                { title: "Loan Disbursed", id: "LN125688", amount: "₹ 2,00,000", date: "27 May 2025", status: "Completed" },
                { title: "Fixed Deposit", id: "FD125687", amount: "₹ 1,00,000", date: "26 May 2025", status: "Completed" },
                { title: "Loan Repayment", id: "LN125686", amount: "₹ 75,000", date: "25 May 2025", status: "Completed" },
              ].map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                  <div>
                    <p className="text-sm font-semibold text-[#08245b]">{t.title}</p>
                    <p className="mt-1 text-xs text-slate-500">ID: {t.id} • {t.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">{t.amount}</p>
                    <span className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">{t.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <aside className="rounded-[20px] bg-white p-6 shadow-md">
            <h3 className="text-lg font-semibold text-[#08245b]">Quick Actions</h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Add Customer' },
                { label: 'New Investment' },
                { label: 'Disburse Loan' },
                { label: 'Transaction' },
                { label: 'Generate Report' },
                { label: 'Send Message' },
              ].map((a) => (
                <button key={a.label} className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-100 bg-[#f8fafc] px-3 py-4 text-center text-sm text-[#08245b] hover:bg-[#eef2f7]">
                  <div className="h-10 w-10 rounded-full bg-[#08245b] text-white flex items-center justify-center">+</div>
                  <span className="text-xs font-medium">{a.label}</span>
                </button>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
