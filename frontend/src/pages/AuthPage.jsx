import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, ShieldCheck, Zap, Briefcase, Code } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "DEVELOPER"
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (isRegister) {
        await register(form.name, form.email, form.password, form.username, form.role);
      } else {
        await login(form.email, form.password);
      }
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fcf8f2] flex flex-col justify-between">
      {/* Top Simple Navigation */}
      <nav className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f59e0b] text-white shadow-md shadow-amber-500/20">
            <Sparkles size={20} className="stroke-[2.5]" />
          </div>
          <span className="text-xl font-black text-[#1e1b18]">CloudNative</span>
        </div>
        <Link
          to={isRegister ? "/login" : "/register"}
          className="text-xs md:text-sm font-bold text-[#b45309] hover:underline"
        >
          {isRegister ? "Already a member? Sign in" : "Need an account? Sign up"}
        </Link>
      </nav>

      {/* Main Container */}
      <div className="w-full max-w-5xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-12 rounded-[2.5rem] border border-[#ebd9bf] bg-white overflow-hidden shadow-xl shadow-amber-900/5">
          
          {/* Left Warm Hero Display */}
          <div className="md:col-span-5 bg-gradient-to-br from-[#fef4e5] via-[#faebd7] to-[#fedfae]/60 p-8 md:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#ebd9bf]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-[#ebd9bf] px-3 py-1 text-xs font-bold text-[#b45309] mb-6">
                <Sparkles size={13} /> CloudNative Jira Board
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-[#1e1b18] leading-tight">
                Bring your work & team together.
              </h2>
              <p className="mt-3 text-sm text-[#6b5847] leading-relaxed">
                Assign tasks with unique usernames, estimate sprint hours, drag & drop Kanban boards, and manage team deliverables.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-2xl p-3 border border-[#ebd9bf]/60">
                <Briefcase size={18} className="text-[#d97706]" />
                <span className="text-xs font-bold text-[#1e1b18]">Manager & Developer Roles</span>
              </div>
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-2xl p-3 border border-[#ebd9bf]/60">
                <Zap size={18} className="text-[#d97706]" />
                <span className="text-xs font-bold text-[#1e1b18]">Live Task Delegation & Notifications</span>
              </div>
            </div>

            <p className="mt-8 text-xs font-medium text-[#8c7a65]">
              &copy; 2026 CloudNative Workspace
            </p>
          </div>

          {/* Right Auth Form */}
          <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-6">
              <h1 className="text-2xl font-black text-[#1e1b18]">
                {isRegister ? "Join CloudNative" : "Welcome back"}
              </h1>
              <p className="mt-1 text-sm font-medium text-[#8c7a65]">
                {isRegister ? "Set your unique username and role" : "Enter your credentials or username to sign in"}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {isRegister && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block text-sm font-bold text-[#1e1b18]">
                      Full Name
                      <input
                        className="field mt-1.5"
                        name="name"
                        placeholder="Alex Johnson"
                        value={form.name}
                        onChange={change}
                        required
                        autoComplete="name"
                      />
                    </label>

                    <label className="block text-sm font-bold text-[#1e1b18]">
                      Unique Username
                      <div className="flex items-center mt-1.5 rounded-2xl border-[1.5px] border-[#ebd9bf] bg-white overflow-hidden focus-within:border-[#f59e0b] focus-within:ring-4 focus-within:ring-amber-500/15 transition-all">
                        <span className="bg-[#fcf8f2] px-3.5 py-2.5 text-[#b45309] font-black text-sm border-r border-[#ebd9bf]">
                          @
                        </span>
                        <input
                          className="w-full px-3 py-2.5 text-sm font-semibold text-[#1e1b18] bg-transparent outline-none"
                          name="username"
                          placeholder="alex_dev"
                          value={form.username}
                          onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
                          required
                          autoComplete="username"
                        />
                      </div>
                    </label>
                  </div>

                  <div>
                    <span className="block text-sm font-bold text-[#1e1b18] mb-2">Select Your Role</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, role: "MANAGER" })}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                          form.role === "MANAGER"
                            ? "border-[#f59e0b] bg-[#fef3c7] text-[#92400e] font-bold"
                            : "border-[#ebd9bf] bg-white text-[#6b5847] font-medium hover:bg-[#fffdfa]"
                        }`}
                      >
                        <Briefcase size={18} className="text-[#d97706]" />
                        <div>
                          <p className="text-xs font-bold">Manager</p>
                          <p className="text-[10px] text-[#8c7a65]">Assign & track</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setForm({ ...form, role: "DEVELOPER" })}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                          form.role === "DEVELOPER"
                            ? "border-[#f59e0b] bg-[#fef3c7] text-[#92400e] font-bold"
                            : "border-[#ebd9bf] bg-white text-[#6b5847] font-medium hover:bg-[#fffdfa]"
                        }`}
                      >
                        <Code size={18} className="text-[#d97706]" />
                        <div>
                          <p className="text-xs font-bold">Developer</p>
                          <p className="text-[10px] text-[#8c7a65]">Execute & build</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <label className="block text-sm font-bold text-[#1e1b18]">
                {isRegister ? "Email Address" : "Email or Username"}
                <input
                  className="field mt-1.5"
                  type={isRegister ? "email" : "text"}
                  name="email"
                  placeholder={isRegister ? "name@company.com" : "alex_dev or name@company.com"}
                  value={form.email}
                  onChange={change}
                  required
                  autoComplete="email"
                />
              </label>

              <label className="block text-sm font-bold text-[#1e1b18]">
                Password
                <input
                  className="field mt-1.5"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={change}
                  required
                  minLength={8}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                />
              </label>

              {error && (
                <p className="rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs font-semibold text-red-700">
                  {error}
                </p>
              )}

              <button
                disabled={busy}
                className="btn-accent w-full justify-center text-sm font-bold py-3 mt-2 shadow-lg shadow-amber-500/20"
              >
                {busy ? "Authenticating..." : isRegister ? "Sign Up As " + (form.role === "MANAGER" ? "Manager" : "Developer") : "Sign In"}
                <ArrowRight size={17} />
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-[#8c7a65]">
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <Link
                className="font-bold text-[#b45309] hover:underline"
                to={isRegister ? "/login" : "/register"}
              >
                {isRegister ? "Sign in to workspace" : "Create username & register"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-[#f59e0b] text-[#78350f] py-6 px-8 mt-12 border-t border-[#d97706]/40">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4 text-xs font-bold">
          <div>
            <span className="text-[#1e1b18] text-sm">CloudNative</span> — Jira-style Kanban, Role Delegation & Sprint Planning.
          </div>
          <div className="flex gap-6">
            <span>Features</span>
            <span>Kanban Board</span>
            <span>API Docs</span>
            <span>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
