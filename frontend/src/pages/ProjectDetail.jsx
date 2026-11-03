import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, FolderKanban } from "lucide-react";
import api, { getErrorMessage } from "../services/api";
import Modal from "../components/Modal";
import TaskForm from "../components/TaskForm";
import { Empty, Status } from "./Dashboard";

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data.data.project);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function createTask(payload) {
    await api.post("/tasks", payload);
    setOpen(false);
    await load();
  }

  async function updateStatus(task, status) {
    try {
      await api.patch(`/tasks/${task.id}`, { status });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (error && !project) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-sm text-red-600 border border-red-200">
        <p className="font-bold">{error}</p>
        <Link to="/projects" className="mt-4 inline-block font-bold text-[#b45309] hover:underline">
          &larr; Back to projects
        </Link>
      </div>
    );
  }

  if (!project) return <p className="p-8 text-center text-sm font-medium text-[#8c7a65]">Loading project...</p>;

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/projects"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#8c7a65] hover:text-[#b45309] transition-colors"
      >
        <ArrowLeft size={16} /> Back to projects
      </Link>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-[#ebd9bf]/80 bg-white p-7 shadow-sm">
        <div className="flex gap-4 items-start">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fef3c7] text-[#92400e] shrink-0">
            <FolderKanban size={22} />
          </span>
          <div>
            <h1 className="text-3xl font-black text-[#1e1b18]">{project.name}</h1>
            <p className="mt-2 text-sm text-[#6b5847] max-w-2xl leading-relaxed">
              {project.description || "No project description provided."}
            </p>
          </div>
        </div>
        <button onClick={() => setOpen(true)} className="btn-accent">
          <Plus size={18} /> Add Task
        </button>
      </header>

      {error && (
        <p className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <section className="rounded-3xl border border-[#ebd9bf]/80 bg-white p-7 shadow-sm">
        <h2 className="mb-5 text-xl font-bold text-[#1e1b18]">Project Tasks</h2>
        {project.tasks.length === 0 ? (
          <Empty text="No tasks in this project yet. Click '+ Add Task' above to start tracking." />
        ) : (
          <div className="space-y-3.5">
            {project.tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#f4e4cf] bg-[#fffdfa] p-5 transition-all hover:border-[#f59e0b] hover:shadow-sm"
              >
                <div>
                  <p className="font-bold text-base text-[#1e1b18]">{task.title}</p>
                  <p className="mt-1 text-xs text-[#6b5847]">
                    {task.description || "No description provided."}
                    {task.assignee ? ` · Assigned to ${task.assignee.name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Status status={task.status} />
                  <select
                    aria-label={`Update status for ${task.title}`}
                    value={task.status}
                    onChange={(e) => updateStatus(task, e.target.value)}
                    className="rounded-xl border border-[#ebd9bf] bg-white px-2.5 py-1 text-xs font-semibold text-[#1e1b18] outline-none hover:border-[#d97706]"
                  >
                    <option value="TODO">To do</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {open && (
        <Modal title="Add Task to Project" onClose={() => setOpen(false)}>
          <TaskForm projects={[project]} onSubmit={createTask} onCancel={() => setOpen(false)} />
        </Modal>
      )}
    </div>
  );
}
