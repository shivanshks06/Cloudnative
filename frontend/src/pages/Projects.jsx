import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Plus, Trash2, ArrowUpRight } from "lucide-react";
import api, { getErrorMessage } from "../services/api";
import Modal from "../components/Modal";
import { Empty } from "./Dashboard";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const { data } = await api.get("/projects");
      setProjects(data.data.projects);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/projects", form);
      setForm({ name: "", description: "" });
      setOpen(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this project and all its tasks?")) return;
    try {
      await api.delete(`/projects/${id}`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#1e1b18]">Projects</h1>
          <p className="mt-1 text-sm font-medium text-[#8c7a65]">Create, manage and organize team deliverables.</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-accent">
          <Plus size={18} /> New Project
        </button>
      </header>

      {error && (
        <p className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="p-8 text-center text-sm font-medium text-[#8c7a65]">Loading projects...</p>
      ) : projects.length === 0 ? (
        <Empty text="No projects found. Click '+ New Project' above to create your first one." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <article
              key={p.id}
              className="flex flex-col justify-between rounded-3xl border border-[#ebd9bf]/80 bg-white p-6 shadow-sm transition-all hover:border-[#f59e0b] hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fef3c7] text-[#92400e]">
                    <FolderKanban size={22} />
                  </span>
                  <button
                    onClick={() => remove(p.id)}
                    className="rounded-xl p-2 text-[#a89580] hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <Link to={`/projects/${p.id}`} className="group mt-5 block">
                  <h2 className="text-xl font-bold text-[#1e1b18] group-hover:text-[#b45309] transition-colors flex items-center justify-between">
                    {p.name}
                    <ArrowUpRight size={18} className="text-[#a89580] group-hover:text-[#b45309]" />
                  </h2>
                </Link>
                <p className="mt-2 line-clamp-3 text-sm font-normal text-[#6b5847] leading-relaxed">
                  {p.description || "No project description provided."}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[#f4e4cf] pt-4 text-xs font-semibold text-[#8c7a65]">
                <span>{p.taskCount || 0} tasks total</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800 border border-emerald-200">
                  {p.completedCount || 0} completed
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {open && (
        <Modal title="Create a New Project" onClose={() => setOpen(false)}>
          <form onSubmit={create} className="space-y-4">
            <label className="block text-sm font-bold text-[#1e1b18]">
              Project Name
              <input
                className="field mt-1.5"
                required
                placeholder="e.g. Cloud Infrastructure"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="block text-sm font-bold text-[#1e1b18]">
              Description
              <textarea
                className="field mt-1.5"
                rows="3"
                placeholder="What is this project about?"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn-accent">
                Create Project
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
