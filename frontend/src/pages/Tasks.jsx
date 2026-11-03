import { useEffect, useState, useRef } from "react";
import {
  Plus,
  Trash2,
  Clock,
  Calendar,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  User,
  ArrowRight,
  Sparkles,
  LayoutGrid,
  List,
  Edit2,
  UserCheck,
  RotateCw,
  Search,
  X
} from "lucide-react";
import api, { getErrorMessage } from "../services/api";
import Modal from "../components/Modal";
import TaskForm from "../components/TaskForm";
import UserAutocomplete from "../components/UserAutocomplete";
import { Empty } from "./Dashboard";
import { useAuth } from "../context/AuthContext";

const COLUMNS = [
  { id: "TODO", title: "To Do", bg: "bg-[#fffdfa]", headerColor: "border-amber-400 text-amber-900" },
  { id: "IN_PROGRESS", title: "In Progress", bg: "bg-[#f8fbff]", headerColor: "border-sky-400 text-sky-900" },
  { id: "DONE", title: "Done", bg: "bg-[#f8fdf9]", headerColor: "border-emerald-400 text-emerald-900" }
];

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [reassigningTask, setReassigningTask] = useState(null);
  const [selectedReassignUser, setSelectedReassignUser] = useState("");
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("KANBAN"); // KANBAN or TABLE
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");

  // Search input for quick assignee filter
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const [showAssigneeSearchDropdown, setShowAssigneeSearchDropdown] = useState(false);

  // Drag and Drop state
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Custom Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState(null);
  const menuRef = useRef(null);

  async function loadData() {
    try {
      const [tRes, pRes, uRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/projects"),
        api.get("/auth/users")
      ]);
      setTasks(tRes.data.data.tasks);
      setProjects(pRes.data.data.projects);
      setUsers(uRes.data.data.users);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Dismiss context menu on window click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    }
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Drag and drop handlers
  function handleDragStart(e, taskId) {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e, colId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  }

  function handleDragLeave(e, colId) {
    if (dragOverCol === colId) {
      setDragOverCol(null);
    }
  }

  async function handleDrop(e, targetStatus) {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    // Optimistic UI Update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      await api.patch(`/tasks/${taskId}`, { status: targetStatus });
    } catch (err) {
      setError(getErrorMessage(err));
      await loadData();
    } finally {
      setDraggedTaskId(null);
    }
  }

  // Right Click handler
  function handleContextMenu(e, task) {
    e.preventDefault();
    e.stopPropagation();

    const x = Math.min(e.clientX, window.innerWidth - 240);
    const y = Math.min(e.clientY, window.innerHeight - 340);

    setContextMenu({
      x,
      y,
      task
    });
  }

  async function updateStatusQuick(taskId, newStatus) {
    setContextMenu(null);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      setError(getErrorMessage(err));
      await loadData();
    }
  }

  async function assignQuick(taskId, assigneeId) {
    setContextMenu(null);
    try {
      await api.patch(`/tasks/${taskId}`, { assigneeId: assigneeId || null });
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function removeTask(taskId, title) {
    setContextMenu(null);
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleSaveTask(payload) {
    try {
      if (editingTask) {
        await api.patch(`/tasks/${editingTask.id}`, payload);
        setEditingTask(null);
      } else {
        await api.post("/tasks", payload);
        setOpenCreate(false);
      }
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleReassignSubmit(newAssigneeId) {
    if (!reassigningTask) return;
    try {
      await api.patch(`/tasks/${reassigningTask.id}`, { assigneeId: newAssigneeId || null });
      setReassigningTask(null);
      setSelectedReassignUser("");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  // Filter tasks based on Project and Assignee selections
  const filteredTasks = tasks.filter((t) => {
    if (projectFilter !== "ALL" && t.projectId !== projectFilter) return false;
    if (assigneeFilter === "UNASSIGNED" && t.assigneeId) return false;
    if (assigneeFilter === "ME" && t.assigneeId !== user?.id) return false;
    if (assigneeFilter !== "ALL" && assigneeFilter !== "UNASSIGNED" && assigneeFilter !== "ME") {
      if (t.assigneeId !== assigneeFilter) return false;
    }
    return true;
  });

  // Assignee Suggestions filtered by query for toolbar
  const filteredAssigneeSuggestions = users.filter((u) => {
    if (!assigneeSearchQuery.trim()) return false;
    const q = assigneeSearchQuery.toLowerCase().replace(/^@/, "");
    return (
      u.username?.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q)
    );
  });

  const selectedAssigneeObj = users.find((u) => u.id === assigneeFilter);
  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";

  return (
    <div className="mx-auto max-w-7xl">
      {/* Top Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-[#1e1b18]">Sprint Board</h1>
            {isManager && (
              <span className="rounded-full bg-amber-100 border border-amber-300 px-3 py-0.5 text-xs font-bold text-amber-900 flex items-center gap-1">
                <UserCheck size={13} /> Manager Mode (Reassign Enabled)
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium text-[#8c7a65]">
            Drag & drop cards across columns. Right-click any card to quick-assign or move status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-2xl border border-[#ebd9bf] bg-white p-1 shadow-xs">
            <button
              onClick={() => setViewMode("KANBAN")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === "KANBAN"
                  ? "bg-[#18181b] text-white shadow-xs"
                  : "text-[#6b5847] hover:bg-[#fff7ea]"
              }`}
            >
              <LayoutGrid size={15} /> Board
            </button>
            <button
              onClick={() => setViewMode("TABLE")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === "TABLE"
                  ? "bg-[#18181b] text-white shadow-xs"
                  : "text-[#6b5847] hover:bg-[#fff7ea]"
              }`}
            >
              <List size={15} /> Table
            </button>
          </div>

          <button
            disabled={!projects.length}
            onClick={() => setOpenCreate(true)}
            className="btn-accent shadow-xs"
          >
            <Plus size={17} /> Create Issue
          </button>
        </div>
      </header>

      {/* Filter Toolbar with Interactive Suggestion Search */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ebd9bf]/80 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          {/* Project select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8c7a65]">Project:</span>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="rounded-xl border border-[#ebd9bf] bg-[#fffdfa] px-3 py-1.5 text-xs font-bold text-[#1e1b18] outline-none hover:border-[#d97706]"
            >
              <option value="ALL">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick preset filters */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setAssigneeFilter("ALL");
                setAssigneeSearchQuery("");
              }}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                assigneeFilter === "ALL"
                  ? "bg-[#18181b] text-white"
                  : "bg-[#fffdfa] border border-[#ebd9bf] text-[#6b5847] hover:bg-[#fff7ea]"
              }`}
            >
              Everyone
            </button>
            <button
              onClick={() => {
                setAssigneeFilter("ME");
                setAssigneeSearchQuery("");
              }}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                assigneeFilter === "ME"
                  ? "bg-[#18181b] text-white"
                  : "bg-[#fffdfa] border border-[#ebd9bf] text-[#6b5847] hover:bg-[#fff7ea]"
              }`}
            >
              Assigned to Me (@{user?.username})
            </button>
            <button
              onClick={() => {
                setAssigneeFilter("UNASSIGNED");
                setAssigneeSearchQuery("");
              }}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                assigneeFilter === "UNASSIGNED"
                  ? "bg-[#18181b] text-white"
                  : "bg-[#fffdfa] border border-[#ebd9bf] text-[#6b5847] hover:bg-[#fff7ea]"
              }`}
            >
              Unassigned
            </button>
          </div>

          {/* Type-To-Suggest Assignee Search */}
          <div className="relative flex items-center">
            {selectedAssigneeObj ? (
              <div className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900">
                <span>@{selectedAssigneeObj.username}</span>
                <button
                  onClick={() => {
                    setAssigneeFilter("ALL");
                    setAssigneeSearchQuery("");
                  }}
                  className="hover:text-red-600"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center rounded-xl border border-[#ebd9bf] bg-[#fffdfa] px-2.5 py-1 text-xs focus-within:border-[#f59e0b]">
                  <Search size={13} className="text-[#8c7a65] mr-1.5" />
                  <input
                    type="text"
                    placeholder="Type name to filter..."
                    value={assigneeSearchQuery}
                    onFocus={() => setShowAssigneeSearchDropdown(true)}
                    onChange={(e) => {
                      setAssigneeSearchQuery(e.target.value);
                      setShowAssigneeSearchDropdown(true);
                    }}
                    className="bg-transparent outline-none text-xs font-semibold text-[#1e1b18] placeholder-[#a89580] w-36"
                  />
                  {assigneeSearchQuery && (
                    <button
                      onClick={() => {
                        setAssigneeSearchQuery("");
                        setShowAssigneeSearchDropdown(false);
                      }}
                      className="text-[#a89580] hover:text-[#1e1b18]"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Autocomplete Suggestion Dropdown */}
                {showAssigneeSearchDropdown && filteredAssigneeSuggestions.length > 0 && (
                  <div className="absolute left-0 top-full mt-1 z-50 w-56 rounded-2xl border border-[#ebd9bf] bg-white p-1.5 shadow-xl">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-[#8c7a65] uppercase">
                      Select Developer:
                    </div>
                    {filteredAssigneeSuggestions.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setAssigneeFilter(u.id);
                          setAssigneeSearchQuery("");
                          setShowAssigneeSearchDropdown(false);
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-bold text-[#1e1b18] hover:bg-[#fff7ea]"
                      >
                        <span>@{u.username}</span>
                        <span className="text-[10px] text-[#8c7a65]">{u.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-xs font-bold text-[#8c7a65]">
          Showing {filteredTasks.length} issues
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* KANBAN BOARD VIEW (Drag & Drop + Right Click) */}
      {viewMode === "KANBAN" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            const isHovered = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={(e) => handleDragLeave(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`rounded-3xl border-2 transition-all min-h-[550px] p-4 flex flex-col ${
                  isHovered
                    ? "border-[#f59e0b] bg-[#fef3c7]/30 shadow-md scale-[1.01]"
                    : "border-[#ebd9bf]/70 bg-white/70 shadow-xs"
                }`}
              >
                {/* Column Header */}
                <div className="mb-4 flex items-center justify-between px-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-[#1e1b18]">{col.title}</span>
                    <span className="rounded-full bg-[#faebd7] px-2 py-0.5 text-xs font-bold text-[#8c7a65]">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setOpenCreate(true)}
                    className="rounded-lg p-1 text-[#8c7a65] hover:bg-[#fff7ea] hover:text-[#1e1b18]"
                    title="Add Issue"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Drop Zone / Card List */}
                <div className="space-y-3.5 flex-1">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onContextMenu={(e) => handleContextMenu(e, task)}
                      className={`group relative rounded-2xl border bg-white p-4.5 shadow-xs transition-all cursor-grab active:cursor-grabbing hover:shadow-md hover:border-[#d97706] ${
                        draggedTaskId === task.id ? "opacity-40 scale-95" : "border-[#ebd9bf]"
                      }`}
                    >
                      {/* Priority Tag & Project Name */}
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="rounded-lg bg-[#faebd7]/70 border border-[#ebd9bf] px-2 py-0.5 text-[#78350f]">
                          {task.project?.name || "Workspace"}
                        </span>
                        <PriorityBadge priority={task.priority} />
                      </div>

                      {/* Title */}
                      <h3 className="mt-2.5 text-sm font-bold text-[#1e1b18] leading-snug group-hover:text-[#b45309] transition-colors">
                        {task.title}
                      </h3>

                      {/* Description */}
                      {task.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-[#6b5847] leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Bottom Meta Details: Due date, est time, assignee */}
                      <div className="mt-3.5 flex flex-wrap items-center justify-between border-t border-[#f4e4cf]/80 pt-3 text-xs">
                        <div className="flex items-center gap-3 text-[#8c7a65]">
                          {task.estimatedHours && (
                            <span className="flex items-center gap-1 font-semibold" title="Estimated hours">
                              <Clock size={13} className="text-[#d97706]" /> {task.estimatedHours}h
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="flex items-center gap-1 font-medium" title="Target completion date">
                              <Calendar size={13} /> {new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>

                        {/* Assignee Avatar / Username */}
                        <div className="flex items-center gap-1">
                          {task.assignee ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-[#fef3c7] border border-amber-300 px-2 py-0.5 text-[11px] font-bold text-[#92400e]"
                              title={`Assigned to ${task.assignee.name}`}
                            >
                              <User size={11} /> @{task.assignee.username}
                            </span>
                          ) : (
                            <span
                              onClick={() => setEditingTask(task)}
                              className="text-[11px] font-semibold text-[#a89580] hover:text-[#d97706] cursor-pointer"
                            >
                              + Assign
                            </span>
                          )}

                          {/* Manager Quick Reassign Icon */}
                          {isManager && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReassigningTask(task);
                                setSelectedReassignUser(task.assigneeId || "");
                              }}
                              className="rounded-lg p-1 text-[#a89580] hover:bg-[#faebd7] hover:text-[#b45309]"
                              title="Manager: Reassign to another developer"
                            >
                              <RotateCw size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right click prompt hint */}
                      <div className="mt-2 text-[10px] text-[#a89580] italic hidden group-hover:block transition-all">
                        💡 Right-click for Jira actions / Reassign
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="rounded-2xl border-2 border-dashed border-[#ebd9bf]/60 p-6 text-center text-xs font-semibold text-[#a89580]">
                      Drop issues here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <section className="rounded-3xl border border-[#ebd9bf]/80 bg-white p-6 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="text-xs uppercase font-extrabold text-[#8c7a65] border-b border-[#f4e4cf]">
                <tr>
                  <th className="pb-3.5">Task Summary</th>
                  <th className="pb-3.5">Project</th>
                  <th className="pb-3.5">Assignee</th>
                  <th className="pb-3.5">Est. Time</th>
                  <th className="pb-3.5">Status</th>
                  <th className="pb-3.5">Due Date</th>
                  <th className="pb-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f7ede0]">
                {filteredTasks.map((t) => (
                  <tr
                    key={t.id}
                    onContextMenu={(e) => handleContextMenu(e, t)}
                    className="hover:bg-[#fffdfa] transition-colors"
                  >
                    <td className="py-4 pr-3">
                      <p className="font-bold text-[#1e1b18]">{t.title}</p>
                      <p className="text-xs text-[#6b5847] line-clamp-1">{t.description || "No description"}</p>
                    </td>
                    <td className="py-4 pr-3">
                      <span className="rounded-lg bg-[#faebd7]/50 border border-[#ebd9bf] px-2.5 py-1 text-xs font-bold text-[#78350f]">
                        {t.project?.name}
                      </span>
                    </td>
                    <td className="py-4 pr-3">
                      <div className="flex items-center gap-1.5">
                        {t.assignee ? (
                          <span className="font-bold text-xs text-[#92400e] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            @{t.assignee.username}
                          </span>
                        ) : (
                          <span className="text-xs text-[#a89580]">Unassigned</span>
                        )}
                        {isManager && (
                          <button
                            onClick={() => {
                              setReassigningTask(t);
                              setSelectedReassignUser(t.assigneeId || "");
                            }}
                            className="text-[#a89580] hover:text-[#b45309]"
                            title="Reassign developer"
                          >
                            <RotateCw size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 pr-3 text-xs font-semibold text-[#6b5847]">
                      {t.estimatedHours ? `${t.estimatedHours} hrs` : "—"}
                    </td>
                    <td className="py-4 pr-3">
                      <select
                        aria-label={`Status for ${t.title}`}
                        value={t.status}
                        onChange={(e) => updateStatusQuick(t.id, e.target.value)}
                        className="rounded-xl border border-[#ebd9bf] bg-white px-2.5 py-1 text-xs font-semibold text-[#1e1b18] outline-none hover:border-[#d97706]"
                      >
                        <option value="TODO">To do</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="DONE">Done</option>
                      </select>
                    </td>
                    <td className="py-4 pr-3 text-xs font-medium text-[#8c7a65]">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingTask(t)}
                          className="rounded-lg p-2 text-[#8c7a65] hover:bg-[#fff7ea] hover:text-[#1e1b18]"
                          title="Edit Task"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => removeTask(t.id, t.title)}
                          className="rounded-lg p-2 text-[#a89580] hover:bg-red-50 hover:text-red-600"
                          title="Delete Task"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* JIRA STYLE RIGHT CLICK CONTEXT MENU */}
      {contextMenu && (
        <div
          ref={menuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 w-64 rounded-2xl border border-[#ebd9bf] bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 text-xs font-medium text-[#1e1b18]"
        >
          <div className="px-3 py-2 border-b border-[#f4e4cf]">
            <p className="font-bold truncate text-[#1e1b18]">{contextMenu.task.title}</p>
            <p className="text-[10px] text-[#8c7a65]">Jira Quick Actions</p>
          </div>

          <div className="py-1">
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#a89580] block">
              Move Status
            </span>
            <button
              onClick={() => updateStatusQuick(contextMenu.task.id, "TODO")}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left hover:bg-[#fff7ea] ${
                contextMenu.task.status === "TODO" ? "font-bold text-[#92400e]" : ""
              }`}
            >
              <span>To Do</span>
              {contextMenu.task.status === "TODO" && "✓"}
            </button>
            <button
              onClick={() => updateStatusQuick(contextMenu.task.id, "IN_PROGRESS")}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left hover:bg-[#fff7ea] ${
                contextMenu.task.status === "IN_PROGRESS" ? "font-bold text-sky-800" : ""
              }`}
            >
              <span>In Progress</span>
              {contextMenu.task.status === "IN_PROGRESS" && "✓"}
            </button>
            <button
              onClick={() => updateStatusQuick(contextMenu.task.id, "DONE")}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left hover:bg-[#fff7ea] ${
                contextMenu.task.status === "DONE" ? "font-bold text-emerald-800" : ""
              }`}
            >
              <span>Done</span>
              {contextMenu.task.status === "DONE" && "✓"}
            </button>
          </div>

          <div className="py-1 border-t border-[#f4e4cf]">
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#a89580] block">
              Delegation / Reassign
            </span>
            <button
              onClick={() => assignQuick(contextMenu.task.id, user?.id)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-left hover:bg-[#fff7ea]"
            >
              <User size={13} className="text-[#d97706]" /> Assign to Me (@{user?.username})
            </button>
            {isManager && (
              <button
                onClick={() => {
                  setReassigningTask(contextMenu.task);
                  setSelectedReassignUser(contextMenu.task.assigneeId || "");
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-left hover:bg-[#fff7ea] font-bold text-[#b45309]"
              >
                <RotateCw size={13} /> Reassign Developer...
              </button>
            )}
            <button
              onClick={() => assignQuick(contextMenu.task.id, null)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-left hover:bg-[#fff7ea] text-[#8c7a65]"
            >
              Unassign
            </button>
          </div>

          <div className="py-1 border-t border-[#f4e4cf]">
            <button
              onClick={() => {
                setEditingTask(contextMenu.task);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-left hover:bg-[#fff7ea]"
            >
              <Edit2 size={13} /> Edit Full Details
            </button>
            <button
              onClick={() => removeTask(contextMenu.task.id, contextMenu.task.title)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-left hover:bg-red-50 text-red-600 font-semibold"
            >
              <Trash2 size={13} /> Delete Issue
            </button>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {openCreate && (
        <Modal title="Create New Issue" onClose={() => setOpenCreate(false)}>
          <TaskForm
            projects={projects}
            onSubmit={handleSaveTask}
            onCancel={() => setOpenCreate(false)}
          />
        </Modal>
      )}

      {/* EDIT MODAL */}
      {editingTask && (
        <Modal title="Edit Task Details" onClose={() => setEditingTask(null)}>
          <TaskForm
            projects={projects}
            initialData={editingTask}
            onSubmit={handleSaveTask}
            onCancel={() => setEditingTask(null)}
          />
        </Modal>
      )}

      {/* MANAGER REASSIGN MODAL WITH TYPE-TO-SUGGEST */}
      {reassigningTask && (
        <Modal title="Reassign Task" onClose={() => setReassigningTask(null)}>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold text-[#1e1b18]">{reassigningTask.title}</p>
              <p className="text-xs text-[#8c7a65] mt-0.5">
                Current Assignee: {reassigningTask.assignee ? `@${reassigningTask.assignee.username} (${reassigningTask.assignee.name})` : "Unassigned"}
              </p>
            </div>

            <UserAutocomplete
              users={users}
              value={selectedReassignUser}
              onChange={setSelectedReassignUser}
              label="Select New Developer"
              placeholder="Type name or @username to search..."
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-[#f4e4cf]">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setReassigningTask(null)}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReassignSubmit(selectedReassignUser)}
                className="btn-accent"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PriorityBadge({ priority }) {
  const styles = {
    LOW: "bg-slate-100 text-slate-700 border-slate-200",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-300",
    HIGH: "bg-orange-100 text-orange-800 border-orange-300",
    URGENT: "bg-red-100 text-red-800 border-red-300"
  };
  return (
    <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${styles[priority] || styles.MEDIUM}`}>
      {priority}
    </span>
  );
}
