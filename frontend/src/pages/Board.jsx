import { useState, useEffect, useCallback } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import api from "../services/api";
import KanbanColumn from "../components/KanbanColumn";
import TicketModal from "../components/TicketModal";

const STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];

export default function Board() {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState("");

  const fetchData = useCallback(async () => {
    const params = filterAssignee ? { assigneeId: filterAssignee } : {};
    const [ticketsRes, usersRes] = await Promise.all([
      api.get("/tickets", { params }),
      api.get("/users"),
    ]);
    setTickets(ticketsRes.data);
    setUsers(usersRes.data);
  }, [filterAssignee]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const ticketId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    // Optimistic update — UI เปลี่ยนทันที ไม่ต้องรอ API
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)),
    );

    try {
      await api.put(`/tickets/${ticketId}`, { status: newStatus });
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

  const ticketsByStatus = (status) =>
    tickets.filter((t) => t.status === status);

  return (
    <div className="min-h-full">
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200">
        <h1 className="text-sm font-semibold text-gray-900 mr-2">Board</h1>
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Members</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
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
              />
            ))}
          </div>
        </div>
      </DragDropContext>

      {(selectedTicket || showCreateModal) && (
        <TicketModal
          ticket={selectedTicket}
          users={users}
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
