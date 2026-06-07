import { useState, useRef, useEffect } from "react";
import { Droppable } from "@hello-pangea/dnd";
import TicketCard from "./TicketCard";

const COLUMN_STYLES = {
  TODO: {
    header: "bg-gray-50 border-gray-200",
    dot: "bg-gray-400",
    label: "To Do",
    count: "bg-gray-200 text-gray-600",
    body: "bg-gray-50 border-gray-200",
  },
  IN_PROGRESS: {
    header: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
    label: "In Progress",
    count: "bg-blue-100 text-blue-700",
    body: "bg-blue-50 border-blue-200",
  },
  BLOCKED: {
    header: "bg-red-50 border-red-200",
    dot: "bg-red-500",
    label: "Blocked",
    count: "bg-red-100 text-red-600",
    body: "bg-red-50 border-red-200",
  },
  DONE: {
    header: "bg-green-50 border-green-200",
    dot: "bg-green-500",
    label: "Done",
    count: "bg-green-100 text-green-700",
    body: "bg-green-50 border-green-200",
  },
};

function WipPopover({ limit, onSave, onClose }) {
  const [value, setValue] = useState(limit ? String(limit) : "");
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-3 w-44"
    >
      <p className="text-xs font-medium text-gray-600 mb-1.5">WIP limit</p>
      <div className="flex gap-1.5">
        <input
          type="number"
          min="1"
          placeholder="No limit"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && onSave(value ? parseInt(value) : null)
          }
          className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 w-0"
          autoFocus
        />
        <button
          onClick={() => onSave(value ? parseInt(value) : null)}
          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          OK
        </button>
      </div>
      {limit && (
        <button
          onClick={() => onSave(null)}
          className="mt-1.5 text-xs text-red-400 hover:text-red-600 transition"
        >
          Remove limit
        </button>
      )}
    </div>
  );
}

export default function KanbanColumn({
  statusKey,
  tickets,
  onTicketClick,
  onStatusChange,
  currentUser,
  wipLimit,
  onWipLimitChange,
  selectedIds,
  onToggleSelect,
}) {
  const s = COLUMN_STYLES[statusKey];
  const [wipOpen, setWipOpen] = useState(false);
  const isOverLimit = wipLimit && tickets.length > wipLimit;

  return (
    <div className="w-72 flex flex-col shrink-0">
      <div
        className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl border border-b-0 relative ${s.header}`}
      >
        <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
        <span className="font-semibold text-gray-700 text-sm">{s.label}</span>
        <span
          className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
            isOverLimit ? "bg-red-100 text-red-600" : s.count
          }`}
        >
          {tickets.length}
          {wipLimit ? `/${wipLimit}` : ""}
        </span>

        {/* WIP limit toggle */}
        <div className="relative">
          <button
            onClick={() => setWipOpen((p) => !p)}
            title="Set WIP limit"
            className={`ml-1 transition ${
              wipLimit
                ? "text-blue-400 hover:text-blue-600"
                : "text-gray-300 hover:text-gray-500"
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="3" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
              />
            </svg>
          </button>
          {wipOpen && (
            <WipPopover
              limit={wipLimit}
              onSave={(v) => {
                onWipLimitChange(v);
                setWipOpen(false);
              }}
              onClose={() => setWipOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Over-limit warning */}
      {isOverLimit && (
        <div className="bg-red-50 border-x border-red-200 px-3 py-1 text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          WIP limit exceeded
        </div>
      )}

      <Droppable droppableId={statusKey}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-72 border rounded-b-xl p-2 space-y-2 transition-colors ${s.body} ${
              snapshot.isDraggingOver
                ? "ring-2 ring-inset ring-blue-300 brightness-95"
                : ""
            }`}
          >
            {tickets.map((ticket, index) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                index={index}
                onClick={() => onTicketClick(ticket)}
                onStatusChange={onStatusChange}
                currentUser={currentUser}
                selected={selectedIds?.has(ticket.id)}
                onToggleSelect={onToggleSelect}
              />
            ))}
            {provided.placeholder}
            {tickets.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-20 text-xs text-gray-300">
                No tickets
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
