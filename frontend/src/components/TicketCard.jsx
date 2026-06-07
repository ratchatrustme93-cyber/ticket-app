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

function DueDateBadge({ dueDate, status }) {
  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((date - today) / 86400000);

  const fmt = date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });

  if (status === "DONE") {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-300 line-through">
        <CalIcon />
        {fmt}
      </span>
    );
  }
  if (diffDays < 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
        <CalIcon />
        เกิน! {fmt}
      </span>
    );
  }
  if (diffDays === 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-orange-500">
        <CalIcon />
        วันนี้
      </span>
    );
  }
  if (diffDays <= 3) {
    return (
      <span className="flex items-center gap-1 text-xs text-amber-500">
        <CalIcon />
        {fmt}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-gray-400">
      <CalIcon />
      {fmt}
    </span>
  );
}

function CalIcon() {
  return (
    <svg
      className="w-3 h-3 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export default function TicketCard({
  ticket,
  index,
  onClick,
  onStatusChange,
  currentUser,
  selected,
  onToggleSelect,
}) {
  const actions = QUICK_ACTIONS[ticket.status] || [];
  const canEdit =
    currentUser?.role === "ADMIN" || ticket.creatorId === currentUser?.id;

  const subtaskTotal = ticket.subtasks?.length ?? 0;
  const subtaskDone = ticket.subtasks?.filter((s) => s.completed).length ?? 0;

  return (
    <Draggable
      draggableId={String(ticket.id)}
      index={index}
      isDragDisabled={!canEdit}
    >
      {(provided, snapshot) => {
        const card = (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`bg-white rounded-lg border p-3 select-none transition-shadow ${
              snapshot.isDragging
                ? "shadow-xl border-blue-300 rotate-1 cursor-grabbing"
                : selected
                  ? "border-blue-400 ring-2 ring-blue-200"
                  : canEdit
                    ? "border-gray-200 hover:shadow-md hover:border-gray-300 cursor-grab"
                    : "border-gray-200 hover:shadow-md cursor-default"
            }`}
            onClick={snapshot.isDragging ? undefined : onClick}
          >
            <div className="flex items-start gap-2 mb-2">
              {/* Bulk select checkbox */}
              <input
                type="checkbox"
                checked={selected ?? false}
                onChange={() => {}}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.(ticket.id);
                }}
                className="mt-0.5 w-3.5 h-3.5 rounded accent-blue-600 shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ opacity: selected ? 1 : undefined }}
              />
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

            {/* Label chips */}
            {ticket.labels?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {ticket.labels.slice(0, 3).map((l) => (
                  <span
                    key={l.id}
                    className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium leading-tight"
                    style={{ backgroundColor: l.color }}
                  >
                    {l.name}
                  </span>
                ))}
                {ticket.labels.length > 3 && (
                  <span className="text-xs text-gray-400 self-center">
                    +{ticket.labels.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Subtask progress */}
            {subtaskTotal > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <svg
                    className="w-3 h-3 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <polyline points="9 11 12 14 22 4" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
                    />
                  </svg>
                  <span className="text-xs text-gray-400">
                    {subtaskDone}/{subtaskTotal}
                  </span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full">
                  <div
                    className="h-full bg-green-400 rounded-full transition-all"
                    style={{ width: `${(subtaskDone / subtaskTotal) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
              <div className="flex items-center gap-2 flex-wrap">
                {canEdit &&
                  actions.map((action) => (
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
                {ticket.dueDate && (
                  <DueDateBadge
                    dueDate={ticket.dueDate}
                    status={ticket.status}
                  />
                )}
              </div>
              {ticket.assignee && (
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: ticket.assignee.color || "#6B7280" }}
                  >
                    <span className="text-xs text-white font-medium">
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
