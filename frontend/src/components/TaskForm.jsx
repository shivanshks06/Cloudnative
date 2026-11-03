import { useState, useEffect } from "react";
import api, { getErrorMessage } from "../services/api";
import UserAutocomplete from "./UserAutocomplete";
import { useAuth } from "../context/AuthContext";
import { AlertCircle, Calendar, Clock, Send, ShieldAlert } from "lucide-react";

export default function TaskForm({
  projects,
  onSubmit,
  onCancel,
  initialData = null,
  onRequestSubmit = null
}) {
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    projectId: initialData?.projectId || projects[0]?.id || "",
    assigneeId: initialData?.assigneeId || "",
    status: initialData?.status || "TODO",
    priority: initialData?.priority || "MEDIUM",
    estimatedHours: initialData?.estimatedHours || 4,
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().slice(0, 10) : ""
  });

  // Developer Request Mode (Extend deadline, Reassign, Blocked)
  const [showRequestForm, setShowRequestForm] = useState(!isManager && initialData !== null);
  const [requestType, setRequestType] = useState("EXTEND_DEADLINE");
  const [requestReason, setRequestReason] = useState("");
  const [suggestedDate, setSuggestedDate] = useState("");
  const [suggestedHours, setSuggestedHours] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    if (isManager) {
      api.get("/auth/users")
        .then((res) => setUsers(res.data.data.users))
        .catch((err) => setError(getErrorMessage(err)));
    }
  }, [isManager]);

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function submit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      assigneeId: form.assigneeId || null,
      dueDate: form.dueDate || null,
      estimatedHours: parseInt(form.estimatedHours, 10) || 4
    });
  }

  async function handleDeveloperRequestSubmit(e) {
    e.preventDefault();
    if (!requestReason.trim()) return;

    setSubmittingRequest(true);
    setError("");
    try {
      await api.post("/requests", {
        taskId: initialData.id,
        type: requestType,
        reason: requestReason,
        suggestedDate: suggestedDate || null,
        suggestedHours: suggestedHours ? parseInt(suggestedHours, 10) : null
      });
      setRequestSuccess("Request submitted to your Manager successfully!");
      if (onRequestSubmit) onRequestSubmit();
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmittingRequest(false);
    }
  }

  // IF USER IS DEVELOPER EDITING A TASK: They cannot overwrite deadline/assignee; they submit formal requests
  if (!isManager && initialData) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-amber-200 bg-[#fef3c7]/40 p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fed7aa] text-[#9a3412] shrink-0 mt-0.5">
              <ShieldAlert size={18} />
            </span>
            <div>
              <p className="text-xs font-bold text-[#1e1b18]">Developer Workflow Notice</p>
              <p className="text-[11px] text-[#6b5847] leading-relaxed mt-0.5">
                Task timelines and reassignments are governed by workspace Managers. You can submit an official request below to extend the deadline, request reassignment, or mark yourself blocked.
              </p>
            </div>
          </div>
        </div>

        {/* Task Overview Snapshot */}
        <div className="rounded-2xl border border-[#ebd9bf] bg-[#fffdfa] p-4 text-xs space-y-2">
          <p className="font-bold text-sm text-[#1e1b18]">{initialData.title}</p>
          <div className="grid grid-cols-2 gap-2 text-[#6b5847]">
            <p><strong>Current Due:</strong> {initialData.dueDate ? new Date(initialData.dueDate).toLocaleDateString() : "No deadline"}</p>
            <p><strong>Est. Time:</strong> {initialData.estimatedHours || 4} hours</p>
            <p><strong>Assignee:</strong> @{initialData.assignee?.username || "unassigned"}</p>
            <p><strong>Status:</strong> {initialData.status}</p>
          </div>
        </div>

        {requestSuccess ? (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center text-xs font-bold text-emerald-800">
            ✓ {requestSuccess}
          </div>
        ) : (
          <form onSubmit={handleDeveloperRequestSubmit} className="space-y-4">
            {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl">{error}</p>}

            <div>
              <label className="block text-xs font-bold text-[#1e1b18] mb-1.5">Select Request Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "EXTEND_DEADLINE", label: "Extend Deadline" },
                  { id: "REASSIGN_TASK", label: "Request Reassign" },
                  { id: "BLOCKED", label: "Mark Blocked" }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setRequestType(t.id)}
                    className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                      requestType === t.id
                        ? "border-[#f59e0b] bg-[#fef3c7] text-[#92400e]"
                        : "border-[#ebd9bf] bg-white text-[#6b5847] hover:bg-[#fff7ea]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {requestType === "EXTEND_DEADLINE" && (
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-bold text-[#1e1b18]">
                  Suggested New Due Date
                  <input
                    type="date"
                    required
                    className="field mt-1"
                    value={suggestedDate}
                    onChange={(e) => setSuggestedDate(e.target.value)}
                  />
                </label>
                <label className="block text-xs font-bold text-[#1e1b18]">
                  Additional Est. Hours
                  <input
                    type="number"
                    min="1"
                    className="field mt-1"
                    placeholder="e.g. 8"
                    value={suggestedHours}
                    onChange={(e) => setSuggestedHours(e.target.value)}
                  />
                </label>
              </div>
            )}

            <label className="block text-xs font-bold text-[#1e1b18]">
              Reason / Explanation for Manager
              <textarea
                required
                rows="3"
                className="field mt-1"
                placeholder={
                  requestType === "EXTEND_DEADLINE"
                    ? "Explain technical blocker, dependency delay, or scope adjustment..."
                    : requestType === "REASSIGN_TASK"
                    ? "Explain why you cannot complete this task or recommend a teammate..."
                    : "Specify what external dependency or access is blocking you..."
                }
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
              />
            </label>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#f4e4cf]">
              <button type="button" className="btn-secondary" onClick={onCancel}>
                Cancel
              </button>
              <button disabled={submittingRequest} className="btn-accent">
                <Send size={14} /> {submittingRequest ? "Submitting..." : "Send Request to Manager"}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // MANAGER VIEW: Full privilege to edit title, description, project, assignee, time, and priority
  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-xl">{error}</p>}

      <label className="block text-sm font-bold text-[#1e1b18]">
        Task Summary / Title
        <input
          name="title"
          className="field mt-1.5"
          required
          placeholder="e.g. Implement OAuth JWT Refresh & Redis Caching"
          value={form.title}
          onChange={change}
        />
      </label>

      <label className="block text-sm font-bold text-[#1e1b18]">
        Description & Scope
        <textarea
          name="description"
          className="field mt-1.5"
          rows="3"
          placeholder="Define acceptance criteria, APIs to touch, or instructions for the developer..."
          value={form.description}
          onChange={change}
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
        <label className="block text-sm font-bold text-[#1e1b18]">
          Project
          <select
            name="projectId"
            className="field mt-1.5"
            value={form.projectId}
            onChange={change}
            required
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        {/* Suggestion Autocomplete Component */}
        <UserAutocomplete
          users={users}
          value={form.assigneeId}
          onChange={(newId) => setForm({ ...form, assigneeId: newId })}
          label="Assignee (@username)"
          placeholder="Type name or username to search..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block text-sm font-bold text-[#1e1b18]">
          Est. Time (Hours)
          <input
            type="number"
            min="1"
            max="160"
            name="estimatedHours"
            className="field mt-1.5"
            value={form.estimatedHours}
            onChange={change}
          />
        </label>

        <label className="block text-sm font-bold text-[#1e1b18]">
          Priority
          <select
            name="priority"
            className="field mt-1.5"
            value={form.priority}
            onChange={change}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent ⚡</option>
          </select>
        </label>

        <label className="block text-sm font-bold text-[#1e1b18]">
          Due Date
          <input
            type="date"
            name="dueDate"
            className="field mt-1.5"
            value={form.dueDate}
            onChange={change}
          />
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-[#f4e4cf]">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-accent">
          {initialData ? "Update Task" : "Create & Assign Task"}
        </button>
      </div>
    </form>
  );
}
