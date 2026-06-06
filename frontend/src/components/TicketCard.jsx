import { Draggable } from "@hello-pangea/dnd";
import { createPortal } from "react-dom";

const PRIORITY_BADGE = {
  LOW: "bg-gray-100 text-gray-500",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-600",
};

const QUICK_ACTIONS = {
  TODO: [{ label: "Start", next: "IN_PROGRESS" }],
  IN_PROGRESS: [
    { label: "Done", next: "DONE" },
    { label: "Block", next: "BLOCKED" },
  ],
  BLOCKED: [{ label: "Resume", next: "IN_PROGRESS" }],
  DONE: [{ label: "Reopen", next: "TODO" }],
};

export default function TicketCard({ ticket, index, onClick, onStatusChange }) {
  const actions = QUICK_ACTIONS[ticket.status] || [];

  return (
    <Draggable draggableId={String(ticket.id)} index={index}>
      {(provided, snapshot) => {
        const card = (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`bg-white rounded-lg border p-3 select-none transition-shadow ${
              snapshot.isDragging
                ? "shadow-xl border-blue-300 rotate-1 cursor-grabbing"
                : "border-gray-200 hover:shadow-md hover:border-gray-300 cursor-grab"
            }`}
            onClick={snapshot.isDragging ? undefined : onClick}
          >
            <div className="flex items-start gap-2 mb-2">
              <p className="text-sm font-medium text-gray-800 leading-snug flex-1">
                {ticket.title}
              </p>
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${PRIORITY_BADGE[ticket.priority]}`}
              >
                {ticket.priority}
              </span>
            </div>

            {ticket.description && (
              <p className="text-xs text-gray-500 mb-2 line-clamp-2 leading-relaxed">
                {ticket.description}
              </p>
            )}

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
              <div className="flex items-center gap-2">
                {actions.map((action) => (
                  <button
                    key={action.next}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(ticket.id, action.next);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    {action.label}
                  </button>
                ))}
                {ticket.notes?.length > 0 && (
                  <span className="text-xs text-gray-300">
                    {ticket.notes.length} note
                    {ticket.notes.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {ticket.assignee && (
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs text-blue-600 font-medium">
                      {ticket.assignee.name[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {ticket.assignee.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        );

        return snapshot.isDragging ? createPortal(card, document.body) : card;
      }}
    </Draggable>
  );
}
