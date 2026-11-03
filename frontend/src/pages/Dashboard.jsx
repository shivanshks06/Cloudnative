import { useEffect, useState } from "react";
import { FolderKanban, CheckSquare, CircleCheck, Clock3, Plus, ArrowUpRight, Sparkles, Users, Briefcase, Calendar, Bell, Check, UserCheck, Inbox, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Stat({ label, value, icon: Icon, tone, borderTone }) {
  return (
    <div className={`rounded-3xl border ${borderTone} bg-white p-6 shadow-xs transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#8c7a65]">{label}</span>
        <span className={`rounded-2xl p-2.5 ${tone}`}>
          <Icon size={20} className="stroke-[2.2]" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-[#1e1b18]">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      const [pRes, tRes, aRes, nRes, rRes] = await Promise.all([
        api.get("/projects"),
        api.get("/tasks"),
        api.get("/activity"),
        api.get("/notifications"),
        api.get("/requests")
      ]);
      setProjects(pRes.data.data.projects);
      setTasks(tRes.data.data.tasks);
      setActivities(aRes.data.data.activities);
      setNotifications(nRes.data.data.notifications || []);
      setUnreadCount(nRes.data.data.unreadCount || 0);
      setRequests(rRes.data.data.requests || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function markNotificationRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  }

  async function markAllNotificationsRead() {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRequestAction(requestId, status) {
    try {
      await api.patch(`/requests/${requestId}`, { status });
      await loadDashboard();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const completed = tasks.filter((t) => t.status === "DONE").length;
  const active = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const myTasks = tasks.filter((t) => t.assigneeId === user?.id);
  const pendingRequests = requests.filter((r) => r.status === "PENDING");

  // Calculate sprint completion %
  const progressPercent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Warm Hero Banner */}
      <section className="mb-8 overflow-hidden rounded-3xl border border-[#eeddc7] bg-gradient-to-r from-[#fef4e5] via-[#fffbf3] to-[#fedfae]/30 p-7 md:p-9 shadow-xs relative">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fde68a] px-3 py-1 text-xs font-bold text-[#854d0e] uppercase tracking-wider">
              <Sparkles size={14} /> Team Workspace
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-[#ebd9bf] px-3 py-1 text-xs font-bold text-[#b45309]">
              <Briefcase size={13} /> {user?.role || "Developer"} Role
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-[#1e1b18] tracking-tight">
            Bring your work & team together
          </h1>
          <p className="mt-3 text-sm md:text-base text-[#6b5847] font-medium leading-relaxed">
            Welcome back, <span className="font-bold text-[#1e1b18]">@{user?.username || user?.name}</span>!{" "}
            {isManager
              ? `You have Manager authority: review developer requests, assign sprint deliverables, and track velocity.`
              : `You have ${myTasks.length} task${myTasks.length === 1 ? "" : "s"} assigned. Need more time or facing blockers? Submit requests directly on your tasks.`}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/tasks" className="btn-accent">
              <Plus size={16} /> Open Sprint Board
            </Link>
            <Link to="/projects" className="btn-secondary">
              View All Projects
            </Link>
          </div>
        </div>

        {/* Manager Sprint Progress Widget */}
        <div className="absolute right-8 bottom-6 hidden lg:block bg-white/90 backdrop-blur-sm border border-[#ebd9bf] p-5 rounded-3xl shadow-xs w-64">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-[#1e1b18]">Sprint Velocity</span>
            <span className="text-xs font-extrabold text-[#d97706]">{progressPercent}%</span>
          </div>
          <div className="w-full bg-[#faebd7] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#d97706] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] font-semibold text-[#8c7a65]">
            {completed} of {tasks.length} tasks completed
          </p>
        </div>
      </section>

      {/* MANAGER INBOX: REVIEW DEVELOPER REQUESTS */}
      {isManager && pendingRequests.length > 0 && (
        <section className="mb-8 rounded-3xl border border-amber-300 bg-[#fffdf7] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Inbox size={18} className="text-[#d97706]" />
              <h2 className="text-base font-bold text-[#1e1b18]">Pending Developer Requests</h2>
              <span className="rounded-full bg-[#fde68a] border border-amber-300 px-2.5 py-0.5 text-xs font-extrabold text-[#78350f]">
                {pendingRequests.length} to review
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ebd9bf] bg-white p-4.5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-[#faebd7] px-2 py-0.5 text-[11px] font-bold text-[#92400e]">
                      {req.type.replace("_", " ")}
                    </span>
                    <span className="text-xs font-bold text-[#1e1b18]">{req.task?.title}</span>
                    <span className="text-xs text-[#8c7a65]">from @{req.user?.username}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#6b5847] italic">"{req.reason}"</p>
                  {req.suggestedDate && (
                    <p className="mt-1 text-[11px] font-semibold text-[#b45309]">
                      Requested New Due Date: {new Date(req.suggestedDate).toLocaleDateString()}
                      {req.suggestedHours ? ` (${req.suggestedHours} additional hrs)` : ""}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRequestAction(req.id, "APPROVED")}
                    className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button
                    onClick={() => handleRequestAction(req.id, "REJECTED")}
                    className="flex items-center gap-1 rounded-xl bg-red-100 text-red-700 px-3 py-1.5 text-xs font-bold hover:bg-red-200 transition-colors"
                  >
                    <XCircle size={14} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DEVELOPER: MY SUBMITTED REQUESTS STATUS */}
      {!isManager && requests.length > 0 && (
        <section className="mb-8 rounded-3xl border border-[#ebd9bf] bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#1e1b18] mb-3">Your Sent Requests</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {requests.slice(0, 4).map((r) => (
              <div key={r.id} className="p-3.5 rounded-2xl border border-[#ebd9bf]/70 bg-[#fffdfa] text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1e1b18]">{r.task?.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      r.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : r.status === "REJECTED"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="mt-1 text-[#6b5847]">{r.type.replace("_", " ")}: "{r.reason}"</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Developer Instant Assignment Notifications Banner */}
      {notifications.length > 0 && (
        <section className="mb-8 rounded-3xl border border-[#ebd9bf] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bell size={18} className="text-[#d97706]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </div>
              <h2 className="text-base font-bold text-[#1e1b18]">Notifications & Alerts</h2>
              {unreadCount > 0 && (
                <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-xs font-bold text-[#b45309] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {notifications.slice(0, 3).map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all ${
                  n.read
                    ? "bg-[#fffcf7] border-[#ebd9bf]/60 opacity-80"
                    : "bg-[#fef3c7]/40 border-amber-300 shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold text-[#1e1b18]">{n.title}</span>
                  {!n.read && (
                    <button
                      onClick={() => markNotificationRead(n.id)}
                      className="text-[#8c7a65] hover:text-[#1e1b18] p-1"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-[#6b5847] leading-relaxed">{n.message}</p>
                <p className="mt-2.5 text-[10px] font-medium text-[#a89580]">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm font-medium text-[#8c7a65]">
          Loading workspace dashboard...
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Active Projects"
              value={projects.length}
              icon={FolderKanban}
              tone="bg-amber-100 text-amber-800"
              borderTone="border-[#ebd9bf]/80"
            />
            <Stat
              label={isManager ? "Total Team Tasks" : "Tasks Assigned To Me"}
              value={isManager ? tasks.length : myTasks.length}
              icon={CheckSquare}
              tone="bg-orange-100 text-orange-800"
              borderTone="border-[#ebd9bf]/80"
            />
            <Stat
              label="In Progress"
              value={active}
              icon={Clock3}
              tone="bg-sky-100 text-sky-800"
              borderTone="border-[#ebd9bf]/80"
            />
            <Stat
              label="Completed"
              value={completed}
              icon={CircleCheck}
              tone="bg-emerald-100 text-emerald-800"
              borderTone="border-[#ebd9bf]/80"
            />
          </section>

          {/* Main Grid: Projects & Activity */}
          <section className="mt-8 grid gap-6 xl:grid-cols-3">
            {/* Projects Overview */}
            <div className="rounded-3xl border border-[#ebd9bf]/80 bg-white p-7 xl:col-span-2 shadow-xs">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#1e1b18]">Your Projects</h2>
                  <p className="mt-1 text-xs font-medium text-[#8c7a65]">Managed projects & task distribution</p>
                </div>
                <Link to="/projects" className="flex items-center gap-1 text-sm font-bold text-[#b45309] hover:text-[#78350f]">
                  View all <ArrowUpRight size={16} />
                </Link>
              </div>

              {projects.length === 0 ? (
                <Empty text="No projects yet. Create your first project to get organized!" />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {projects.slice(0, 4).map((p) => (
                    <Link
                      key={p.id}
                      to={`/projects/${p.id}`}
                      className="group rounded-2xl border border-[#f0dfc8] bg-[#fffcf7] p-5 transition-all hover:border-[#d97706] hover:bg-[#fff7ea] hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fed7aa] text-[#9a3412]">
                          <FolderKanban size={18} />
                        </span>
                        <ArrowUpRight size={16} className="text-[#8c7a65] group-hover:text-[#b45309] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                      <h3 className="mt-4 font-bold text-[#1e1b18] group-hover:text-[#b45309] transition-colors">
                        {p.name}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-xs text-[#6b5847] leading-relaxed">
                        {p.description || "No description provided."}
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-[#f4e4cf] pt-3 text-xs font-semibold text-[#8c7a65]">
                        <span>{p.taskCount || 0} tasks</span>
                        <span className="text-emerald-700">{p.completedCount || 0} completed</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="rounded-3xl border border-[#ebd9bf]/80 bg-white p-7 shadow-xs">
              <h2 className="text-lg font-bold text-[#1e1b18]">Activity Stream</h2>
              <p className="mt-1 text-xs font-medium text-[#8c7a65]">Real-time audit log of team actions</p>
              <div className="mt-5 space-y-4">
                {activities.length ? (
                  activities.slice(0, 5).map((a) => (
                    <div key={a.id} className="border-l-2 border-[#f59e0b] pl-3.5 py-0.5">
                      <p className="text-xs font-semibold text-[#1e1b18]">{a.message}</p>
                      <p className="mt-1 text-[11px] font-medium text-[#a89580]">
                        {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-xs font-medium text-[#8c7a65]">
                    Activity will appear here as your team works.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Developer / Team Task List */}
          <section className="mt-6 rounded-3xl border border-[#ebd9bf]/80 bg-white p-7 shadow-xs">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#1e1b18]">
                  {isManager ? "Team Sprint Tasks" : "Tasks Assigned To You (@" + user?.username + ")"}
                </h2>
                <p className="mt-1 text-xs font-medium text-[#8c7a65]">
                  {isManager
                    ? "Manage and reassign tasks across all developers"
                    : "Your active workload and deliverables"}
                </p>
              </div>
              <Link to="/tasks" className="flex items-center gap-1 text-sm font-bold text-[#b45309] hover:text-[#78350f]">
                Open interactive board <ArrowUpRight size={16} />
              </Link>
            </div>
            {(isManager ? tasks : myTasks).length ? (
              <div className="divide-y divide-[#f7ede0]">
                {(isManager ? tasks : myTasks).slice(0, 6).map((t) => (
                  <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div>
                      <p className="text-sm font-bold text-[#1e1b18]">{t.title}</p>
                      <p className="mt-0.5 text-xs font-medium text-[#8c7a65]">
                        {t.project?.name} · {t.assignee ? `Assigned to @${t.assignee.username}` : "Unassigned"}
                        {t.estimatedHours ? ` · ${t.estimatedHours}h est.` : ""}
                      </p>
                    </div>
                    <Status status={t.status} />
                  </div>
                ))}
              </div>
            ) : (
              <Empty text={isManager ? "No tasks created yet." : "You have no tasks assigned to you right now."} />
            )}
          </section>
        </>
      )}
    </div>
  );
}

export function Status({ status }) {
  const styles = {
    TODO: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
    IN_PROGRESS: "bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]",
    DONE: "bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]"
  };
  const labels = { TODO: "To do", IN_PROGRESS: "In progress", DONE: "Done" };
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${styles[status] || styles.TODO}`}>
      {labels[status] || status}
    </span>
  );
}

export function Empty({ text }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[#ebd9bf] bg-[#fffdfa] p-8 text-center text-sm font-medium text-[#8c7a65]">
      {text}
    </div>
  );
}
