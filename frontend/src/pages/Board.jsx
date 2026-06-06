import { useState, useEffect, useCallback, useMemo } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import KanbanColumn from "../components/KanbanColumn";
import TicketModal from "../components/TicketModal";

const STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];

export default function Board() {
  const { user: currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [labels, setLabels] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filters (all client-side)
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterLabel, setFilterLabel] = useState("");

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

    // Tickets visible in the destination column (the drag visual context)
    const destTickets = ticketsByStatus(newStatus).filter(
      (t) => t.id !== ticketId,
    );

    // Compute midpoint position between neighbours
    const posOf = (t, fallbackIdx) =>
      t.position !== 0 ? t.position : (fallbackIdx + 1) * 1_000_000;

    const before = destTickets[destination.index - 1];
    const after = destTickets[destination.index];

    const beforeIdx = before ? destTickets.indexOf(before) : -1;
    const afterIdx = after ? destTickets.indexOf(after) : -1;

    const beforePos = before ? posOf(before, beforeIdx) : 0;
    const afterPos = after ? posOf(after, afterIdx) : beforePos + 2_000_000;

    const newPosition = (beforePos + afterPos) / 2;

    // Optimistic update
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg pl-8 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Assignee filter */}
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
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
            onChange={(e) => setFilterLabel(e.target.value)}
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
            onClick={() => {
              setSearchQuery("");
              setFilterAssignee("");
              setFilterLabel("");
            }}
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

        <button
          onClick={() => setShowCreateModal(true)}
          className="ml-auto bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + New Ticket
        </button>
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
              />
            ))}
          </div>
        </div>
      </DragDropContext>

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
    </div>
  );
}
