import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUSES = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "DONE", label: "Done" },
];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

export default function TicketModal({
  ticket,
  users,
  onClose,
  onSave,
  onDelete,
  onRefresh,
}) {
  const { user } = useAuth();
  const isEdit = !!ticket;
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    assigneeId: "",
    dueDate: "",
  });
  const [ticketData, setTicketData] = useState(ticket);
  const [noteInput, setNoteInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ticket) {
      setForm({
        title: ticket.title,
        description: ticket.description || "",
        status: ticket.status,
        priority: ticket.priority,
        assigneeId: ticket.assigneeId ? String(ticket.assigneeId) : "",
        dueDate: ticket.dueDate ? ticket.dueDate.slice(0, 10) : "",
      });
      setTicketData(ticket);
    }
  }, [ticket]);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...form, id: ticket?.id });
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteInput.trim()) return;
    await api.post(`/tickets/${ticket.id}/notes`, {
      content: noteInput.trim(),
    });
    setNoteInput("");
    const res = await api.get(`/tickets/${ticket.id}`);
    setTicketData(res.data);
    onRefresh();
  };

  const handleDeleteNote = async (noteId) => {
    await api.delete(`/tickets/${ticket.id}/notes/${noteId}`);
    const res = await api.get(`/tickets/${ticket.id}`);
    setTicketData(res.data);
    onRefresh();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? `Ticket #${ticket.id}` : "New Ticket"}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition text-lg"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Title
            </label>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Description
            </label>
            <textarea
              placeholder="Add more details (optional)"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((p) => ({ ...p, priority: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Assignee
              </label>
              <select
                value={form.assigneeId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, assigneeId: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dueDate: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {isEdit && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Notes & Issues
                </h3>
                <span className="text-xs text-gray-400">
                  {ticketData?.notes?.length || 0} notes
                </span>
              </div>

              <div className="space-y-2 mb-3 max-h-52 overflow-y-auto">
                {!ticketData?.notes?.length && (
                  <p className="text-xs text-gray-400 py-2">
                    No notes yet. Add one to track progress or blockers.
                  </p>
                )}
                {ticketData?.notes?.map((note) => (
                  <div
                    key={note.id}
                    className="bg-gray-50 border border-gray-100 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs text-blue-600 font-medium">
                            {note.user.name[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                          {note.user.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(note.createdAt).toLocaleString("th-TH", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {note.userId === user?.id && (
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-gray-300 hover:text-red-400 transition text-base leading-none"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 ml-7">{note.content}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a note or describe a blocker..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!noteInput.trim()}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          {isEdit ? (
            <button
              onClick={() => {
                if (confirm("Delete this ticket?")) onDelete(ticket.id);
              }}
              className="text-sm text-red-400 hover:text-red-600 transition"
            >
              Delete ticket
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!form.title.trim() || saving}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create ticket"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
