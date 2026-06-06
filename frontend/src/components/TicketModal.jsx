import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUSES = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "DONE", label: "Done" },
];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

const STATUS_TH = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  DONE: "Done",
};

const LABEL_COLORS = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#10B981",
  "#06B6D4",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#6B7280",
];

function relativeTime(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "เมื่อกี้";
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีก่อน`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชม.ก่อน`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return "เมื่อวาน";
  if (days < 7) return `${days} วันก่อน`;
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
}

function getActivityText(a) {
  switch (a.action) {
    case "created":
      return "สร้าง ticket นี้";
    case "status_changed":
      return `เปลี่ยน status จาก ${STATUS_TH[a.fromValue] || a.fromValue} → ${STATUS_TH[a.toValue] || a.toValue}`;
    case "priority_changed":
      return `เปลี่ยน priority เป็น ${a.toValue}`;
    case "assignee_changed":
      if (a.toValue) return `มอบหมายให้ ${a.toValue}`;
      return `ยกเลิก assignee (จาก ${a.fromValue || "ไม่มี"})`;
    default:
      return a.action;
  }
}

function ActivityItem({ activity: a }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-xs text-gray-500 font-medium">
          {a.user.name[0].toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-gray-700">{a.user.name}</span>
        <span className="text-xs text-gray-500"> {getActivityText(a)}</span>
      </div>
      <span className="text-xs text-gray-300 shrink-0 ml-1">
        {relativeTime(a.createdAt)}
      </span>
    </div>
  );
}

export default function TicketModal({
  ticket,
  users,
  labels,
  onClose,
  onSave,
  onDelete,
  onRefresh,
  onLabelCreated,
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
    labelIds: [],
  });
  const [ticketData, setTicketData] = useState(ticket);
  const [noteInput, setNoteInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Label picker state
  const [labelPickerOpen, setLabelPickerOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3B82F6");
  const labelPickerRef = useRef(null);

  // Activity state
  const [showAllActivity, setShowAllActivity] = useState(false);

  useEffect(() => {
    if (ticket) {
      setForm({
        title: ticket.title,
        description: ticket.description || "",
        status: ticket.status,
        priority: ticket.priority,
        assigneeId: ticket.assigneeId ? String(ticket.assigneeId) : "",
        dueDate: ticket.dueDate ? ticket.dueDate.slice(0, 10) : "",
        labelIds: ticket.labels?.map((l) => l.id) || [],
      });
      setTicketData(ticket);
    }
  }, [ticket]);

  // Close label picker on outside click
  useEffect(() => {
    if (!labelPickerOpen) return;
    function handleClick(e) {
      if (
        labelPickerRef.current &&
        !labelPickerRef.current.contains(e.target)
      ) {
        setLabelPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [labelPickerOpen]);

  const toggleLabel = (labelId) => {
    setForm((p) => ({
      ...p,
      labelIds: p.labelIds.includes(labelId)
        ? p.labelIds.filter((id) => id !== labelId)
        : [...p.labelIds, labelId],
    }));
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    try {
      const res = await api.post("/labels", {
        name: newLabelName.trim(),
        color: newLabelColor,
      });
      onLabelCreated?.(res.data);
      setForm((p) => ({ ...p, labelIds: [...p.labelIds, res.data.id] }));
      setNewLabelName("");
    } catch {
      // duplicate name — ignore silently
    }
  };

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

  const activities = ticketData?.activities || [];
  const visibleActivities = showAllActivity
    ? activities
    : activities.slice(0, 5);

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
          {/* Title */}
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

          {/* Description */}
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

          {/* Status / Priority / Assignee / Due Date */}
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

          {/* Labels */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Labels
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {form.labelIds.map((id) => {
                const label = labels?.find((l) => l.id === id);
                return label ? (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleLabel(id)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white hover:opacity-80 transition"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                    <span className="opacity-70 text-sm leading-none">×</span>
                  </button>
                ) : null;
              })}

              {/* Picker trigger */}
              <div className="relative" ref={labelPickerRef}>
                <button
                  type="button"
                  onClick={() => setLabelPickerOpen((p) => !p)}
                  className="text-xs px-2 py-0.5 rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition"
                >
                  + Add label
                </button>

                {labelPickerOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-2">
                    {/* Available labels */}
                    <div className="max-h-36 overflow-y-auto">
                      {(labels || [])
                        .filter((l) => !form.labelIds.includes(l.id))
                        .map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => {
                              toggleLabel(l.id);
                              setLabelPickerOpen(false);
                            }}
                            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-gray-50 text-left"
                          >
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: l.color }}
                            />
                            <span className="text-sm text-gray-700">
                              {l.name}
                            </span>
                          </button>
                        ))}
                      {(labels || []).filter(
                        (l) => !form.labelIds.includes(l.id),
                      ).length === 0 && (
                        <p className="text-xs text-gray-400 px-2 py-1.5">
                          ใช้ทุก label แล้ว
                        </p>
                      )}
                    </div>

                    {/* Create new label */}
                    <div className="border-t border-gray-100 mt-1 pt-2 px-1 space-y-1.5">
                      <div className="flex flex-wrap gap-1">
                        {LABEL_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewLabelColor(c)}
                            className="w-4 h-4 rounded-full border-2 transition-transform hover:scale-110"
                            style={{
                              backgroundColor: c,
                              borderColor:
                                newLabelColor === c ? "white" : "transparent",
                              outline:
                                newLabelColor === c ? `2px solid ${c}` : "none",
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          placeholder="ชื่อ label..."
                          value={newLabelName}
                          onChange={(e) => setNewLabelName(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleCreateLabel()
                          }
                          className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleCreateLabel}
                          disabled={!newLabelName.trim()}
                          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-40"
                        >
                          สร้าง
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes section */}
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

          {/* Activity log */}
          {isEdit && activities.length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  Activity
                </h3>
                {activities.length > 5 && (
                  <button
                    onClick={() => setShowAllActivity((p) => !p)}
                    className="text-xs text-blue-500 hover:text-blue-700 transition"
                  >
                    {showAllActivity
                      ? "แสดงน้อยลง"
                      : `ดูทั้งหมด ${activities.length}`}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {visibleActivities.map((a) => (
                  <ActivityItem key={a.id} activity={a} />
                ))}
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
