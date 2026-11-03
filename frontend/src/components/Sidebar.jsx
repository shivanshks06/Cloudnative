import { NavLink } from "react-router-dom";
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, Sparkles, User, Briefcase, Code } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/tasks", label: "Sprint Board", icon: CheckSquare },
  { to: "/projects", label: "Projects", icon: FolderKanban }
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";

  return (
    <aside className="flex w-full flex-col border-b border-[#ebd9bf]/70 bg-[#fffdfa] p-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:p-6">
      {/* Brand Header */}
      <div className="mb-6 flex items-center gap-3 md:mb-10">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f59e0b] text-white shadow-md shadow-amber-500/20">
          <Sparkles size={22} className="stroke-[2.5]" />
        </div>
        <div>
          <div className="text-xl font-black tracking-tight text-[#1e1b18]">CloudNative</div>
          <div className="text-xs font-semibold text-[#8c7a65]">Sprint & Kanban Workspace</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex gap-2 overflow-x-auto md:flex-col md:gap-2.5">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                isActive
                  ? "bg-[#fef3c7] text-[#92400e] shadow-sm shadow-amber-200/50"
                  : "text-[#6b5847] hover:bg-[#faebd7]/50 hover:text-[#1e1b18]"
              }`
            }
          >
            <Icon size={19} className="shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Role Pill */}
      <div className="mt-4 flex items-center justify-between border-t border-[#ebd9bf]/60 pt-4 md:mt-auto md:block">
        <div className="rounded-2xl bg-[#faebd7]/40 p-3.5 border border-[#ebd9bf]/50">
          <div className="flex items-center justify-between">
            <p className="truncate text-sm font-bold text-[#1e1b18]">{user?.name || "Workspace Member"}</p>
            <span className="flex items-center gap-1 rounded-full bg-[#fde68a] px-2 py-0.5 text-[10px] font-extrabold text-[#78350f]">
              {isManager ? <Briefcase size={10} /> : <Code size={10} />}
              {user?.role || "DEV"}
            </span>
          </div>
          <p className="truncate text-xs font-bold text-[#b45309] mt-0.5">@{user?.username || "user"}</p>
          <p className="truncate text-[11px] font-medium text-[#8c7a65] mt-0.5">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="mt-0 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#8c7a65] hover:bg-[#faebd7]/60 hover:text-[#92400e] transition-all md:mt-3 md:w-full"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
