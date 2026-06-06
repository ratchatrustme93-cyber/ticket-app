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

export default function KanbanColumn({
  statusKey,
  tickets,
  onTicketClick,
  onStatusChange,
}) {
  const s = COLUMN_STYLES[statusKey];

  return (
    <div className="w-72 flex flex-col shrink-0">
      <div
        className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl border border-b-0 ${s.header}`}
      >
        <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
        <span className="font-semibold text-gray-700 text-sm">{s.label}</span>
        <span
          className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${s.count}`}
        >
          {tickets.length}
        </span>
      </div>
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
