import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import logoSvg from "./assets/logo.svg";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const success = login(form.email, form.password);

    if (success) {
      navigate("/dashboard", { replace: true });
      return;
    }

    setError("Invalid credentials. Use admin@example.com with password 123456.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#d9e2ef] px-4 py-10">
      <div className="w-full max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-[0_40px_120px_rgba(15,23,42,0.12)]">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative flex items-center justify-center overflow-hidden bg-[#08245b] p-8 md:p-10 lg:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.08),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.05),_transparent_20%)]" />
            <div className="absolute top-6 left-6 h-40 w-40 rounded-full border border-white/10 bg-white/5 blur-3xl" />
            <div className="absolute bottom-6 right-10 h-32 w-32 rounded-full border border-white/10 bg-white/5 blur-3xl" />
            <div className="relative z-10 flex w-full max-w-xl items-center justify-center text-white">
              <div className="rounded-[40px] bg-white/95 p-9 shadow-2xl shadow-slate-950/10 backdrop-blur-sm">
                <img src={logoSvg} alt="Mhaveer Logo" className="h-52 w-52 md:h-60 md:w-60 object-contain" />
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10 lg:p-12">
            <div className="mx-auto max-w-md">
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-slate-900">Login</h2>
                <p className="mt-3 text-sm text-slate-500">Welcome back! Please login to your account.</p>
              </div>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm">
                    <label className="sr-only" htmlFor="email">Email Address</label>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(event) => setForm({ ...form, email: event.target.value })}
                        className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder="Email Address"
                        required
                      />
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm">
                    <label className="sr-only" htmlFor="password">Password</label>
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-slate-400" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(event) => setForm({ ...form, password: event.target.value })}
                        className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder="Password"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-slate-400 transition hover:text-slate-700">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="w-full rounded-[28px] bg-[#08245b] px-4 py-4 text-sm font-semibold text-white shadow-xl shadow-slate-900/10 transition hover:bg-[#0d2f6e]"
                >
                  Login
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
