import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import KanbanColumn from "../components/KanbanColumn";
import TicketModal from "../components/TicketModal";

const STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];

const WIP_KEY = "kanban_wip_limits";

function loadWipLimits() {
  try {
    return JSON.parse(localStorage.getItem(WIP_KEY)) || {};
  } catch {
    return {};
  }
}

function ShortcutHelp({ onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-72"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="space-y-2">
          {[
            ["N", "New ticket"],
            ["?", "Show shortcuts"],
            ["Esc", "Close modal / deselect all"],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{desc}</span>
              <kbd className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Board() {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [labels, setLabels] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  // WIP limits
  const [wipLimits, setWipLimits] = useState(loadWipLimits);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Filters — persisted in URL
  const searchQuery = searchParams.get("q") || "";
  const filterAssignee = searchParams.get("assignee") || "";
  const filterLabel = searchParams.get("label") || "";

  const setFilter = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, String(value));
      else next.delete(key);
      return next;
    });
  };

  const fetchData = useCallback(async () => {
    const [ticketsRes, usersRes, labelsRes] = await Promise.all([
      api.get("/tickets"),
      api.get("/users"),
      api.get("/labels"),
    ]);
    setTickets(ticketsRes.data);
    setUsers(usersRes.data);
    setLabels(labelsRes.data);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handle = (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable)
        return;
      if (e.key === "n" || e.key === "N") {
        setShowCreateModal(true);
      } else if (e.key === "?") {
        setShowShortcutHelp((p) => !p);
      } else if (e.key === "Escape") {
        setSelectedIds(new Set());
        setShowShortcutHelp(false);
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  // Client-side filtering
  const filteredTickets = useMemo(() => {
    let result = tickets;
    if (filterAssignee) {
      result = result.filter((t) => t.assigneeId === parseInt(filterAssignee));
    }
    if (filterLabel) {
      result = result.filter((t) =>
        t.labels?.some((l) => l.id === parseInt(filterLabel)),
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [tickets, filterAssignee, filterLabel, searchQuery]);

  const ticketsByStatus = (status) =>
    filteredTickets.filter((t) => t.status === status);

  const hasFilter = searchQuery || filterAssignee || filterLabel;

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const ticketId = parseInt(draggableId);
    const newStatus = destination.droppableId;
    const destTickets = ticketsByStatus(newStatus).filter(
      (t) => t.id !== ticketId,
    );
    const posOf = (t, fallbackIdx) =>
      t.position !== 0 ? t.position : (fallbackIdx + 1) * 1_000_000;
    const before = destTickets[destination.index - 1];
    const after = destTickets[destination.index];
    const beforeIdx = before ? destTickets.indexOf(before) : -1;
    const afterIdx = after ? destTickets.indexOf(after) : -1;
    const beforePos = before ? posOf(before, beforeIdx) : 0;
    const afterPos = after ? posOf(after, afterIdx) : beforePos + 2_000_000;
    const newPosition = (beforePos + afterPos) / 2;

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: newStatus, position: newPosition }
          : t,
      ),
    );
    try {
      await api.put(`/tickets/${ticketId}`, {
        status: newStatus,
        position: newPosition,
      });
    } catch {
      fetchData();
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    await api.put(`/tickets/${ticketId}`, { status: newStatus });
    fetchData();
  };

  const handleDelete = async (ticketId) => {
    await api.delete(`/tickets/${ticketId}`);
    setSelectedTicket(null);
    fetchData();
  };

  const handleSave = async (data) => {
    if (data.id) {
      await api.put(`/tickets/${data.id}`, data);
    } else {
      await api.post("/tickets", data);
    }
    setShowCreateModal(false);
    setSelectedTicket(null);
    fetchData();
  };

  const handleTicketClick = async (ticket) => {
    const res = await api.get(`/tickets/${ticket.id}`);
    setSelectedTicket(res.data);
  };

  const canEditTicket = (ticket) =>
    !ticket ||
    currentUser?.role === "ADMIN" ||
    ticket.creatorId === currentUser?.id;

  const handleLabelCreated = (label) => {
    setLabels((prev) =>
      [...prev, label].sort((a, b) => a.name.localeCompare(b.name)),
    );
  };

  // WIP limit management
  const updateWipLimit = (status, limit) => {
    const updated = { ...wipLimits, [status]: limit || undefined };
    if (!limit) delete updated[status];
    setWipLimits(updated);
    localStorage.setItem(WIP_KEY, JSON.stringify(updated));
  };

  // Bulk actions
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStatusChange = async (newStatus) => {
    await Promise.all(
      [...selectedIds].map((id) =>
        api.put(`/tickets/${id}`, { status: newStatus }),
      ),
    );
    setSelectedIds(new Set());
    fetchData();
  };

  const handleBulkAssign = async (assigneeId) => {
    await Promise.all(
      [...selectedIds].map((id) =>
        api.put(`/tickets/${id}`, {
          assigneeId: assigneeId ? parseInt(assigneeId) : null,
        }),
      ),
    );
    setSelectedIds(new Set());
    fetchData();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} tickets?`)) return;
    await Promise.all(
      [...selectedIds].map((id) => api.delete(`/tickets/${id}`)),
    );
    setSelectedIds(new Set());
    fetchData();
  };

  // CSV export
  const exportCSV = () => {
    const headers = [
      "ID",
      "Title",
      "Status",
      "Priority",
      "Assignee",
      "Creator",
      "Due Date",
      "Labels",
      "Subtasks Done",
      "Subtasks Total",
      "Created",
    ];
    const rows = filteredTickets.map((t) => [
      t.id,
      `"${(t.title || "").replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.assignee?.name || "",
      t.creator?.name || "",
      t.dueDate ? t.dueDate.slice(0, 10) : "",
      `"${t.labels?.map((l) => l.name).join(", ") || ""}"`,
      t.subtasks?.filter((s) => s.completed).length ?? 0,
      t.subtasks?.length ?? 0,
      t.createdAt ? t.createdAt.slice(0, 10) : "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkAssignee, setBulkAssignee] = useState("");

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200 flex-wrap">
        <h1 className="text-sm font-semibold text-gray-900 mr-1">Board</h1>

        {/* Search */}
        <div className="relative">
          <svg
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setFilter("q", e.target.value)}
            className="text-sm border border-gray-300 rounded-lg pl-8 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setFilter("q", "")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Assignee filter */}
        <select
          value={filterAssignee}
          onChange={(e) => setFilter("assignee", e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Members</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        {/* Label filter */}
        {labels.length > 0 && (
          <select
            value={filterLabel}
            onChange={(e) => setFilter("label", e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Labels</option>
            {labels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        )}

        {/* Clear filters */}
        {hasFilter && (
          <button
            onClick={() => setSearchParams({})}
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            Clear
          </button>
        )}

        {/* Search result count */}
        {searchQuery && (
          <span className="text-xs text-gray-400">
            {filteredTickets.length} result
            {filteredTickets.length !== 1 ? "s" : ""}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Shortcut help */}
          <button
            onClick={() => setShowShortcutHelp(true)}
            title="Keyboard shortcuts (?)"
            className="text-gray-400 hover:text-gray-600 transition p-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"
              />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>

          {/* Export CSV */}
          <button
            onClick={exportCSV}
            title="Export to CSV"
            className="text-gray-400 hover:text-gray-600 transition p-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            + New Ticket
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="p-6 overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                statusKey={status}
                tickets={ticketsByStatus(status)}
                onTicketClick={handleTicketClick}
                onStatusChange={handleStatusChange}
                currentUser={currentUser}
                wipLimit={wipLimits[status]}
                onWipLimitChange={(limit) => updateWipLimit(status, limit)}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        </div>
      </DragDropContext>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 text-sm">
          <span className="font-medium text-gray-300">
            {selectedIds.size} selected
          </span>
          <div className="w-px h-4 bg-gray-600" />
          <select
            value={bulkStatus}
            onChange={(e) => {
              if (e.target.value) handleBulkStatusChange(e.target.value);
              setBulkStatus("");
            }}
            className="bg-gray-800 text-white rounded-lg px-2 py-1 text-xs border border-gray-700 focus:outline-none"
          >
            <option value="">Change status...</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="DONE">Done</option>
          </select>
          <select
            value={bulkAssignee}
            onChange={(e) => {
              handleBulkAssign(e.target.value);
              setBulkAssignee("");
            }}
            className="bg-gray-800 text-white rounded-lg px-2 py-1 text-xs border border-gray-700 focus:outline-none"
          >
            <option value="">Assign to...</option>
            <option value="0">Unassign all</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleBulkDelete}
            className="text-red-400 hover:text-red-300 transition text-xs font-medium"
          >
            Delete
          </button>
          <div className="w-px h-4 bg-gray-600" />
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-gray-400 hover:text-white transition"
          >
            ×
          </button>
        </div>
      )}

      {(selectedTicket || showCreateModal) && (
        <TicketModal
          ticket={selectedTicket}
          users={users}
          labels={labels}
          canEdit={canEditTicket(selectedTicket)}
          onLabelCreated={handleLabelCreated}
          onClose={() => {
            setSelectedTicket(null);
            setShowCreateModal(false);
          }}
          onSave={handleSave}
          onDelete={handleDelete}
          onRefresh={fetchData}
        />
      )}

      {showShortcutHelp && (
        <ShortcutHelp onClose={() => setShowShortcutHelp(false)} />
      )}
    </div>
  );
}
