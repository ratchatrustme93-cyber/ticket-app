import { useState, useEffect } from "react";
import api from "../services/api";

const STATUS_STYLE = {
  TODO: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  BLOCKED: "bg-red-100 text-red-600",
  DONE: "bg-green-100 text-green-700",
};
const STATUS_LABEL = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  DONE: "Done",
};

const STATUS_ORDER = ["IN_PROGRESS", "BLOCKED", "TODO", "DONE"];

export default function Daily() {
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    Promise.all([api.get("/users"), api.get("/tickets")]).then(
      ([usersRes, ticketsRes]) => {
        setUsers(usersRes.data);
        setTickets(ticketsRes.data);
      },
    );
  }, []);

  const getTicketsForUser = (userId) =>
    tickets
      .filter((t) => t.assigneeId === userId)
      .sort(
        (a, b) =>
          STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
      );

  const unassigned = tickets
    .filter((t) => !t.assigneeId && t.status !== "DONE")
    .sort(
      (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
    );

  const today = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const blockedCount = tickets.filter((t) => t.status === "BLOCKED").length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "IN_PROGRESS",
  ).length;
  const doneCount = tickets.filter((t) => t.status === "DONE").length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Daily Standup</h1>
        <p className="text-sm text-gray-500 mt-0.5">{today}</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">In Progress</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-2xl font-bold text-red-500">{blockedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Blocked</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-2xl font-bold text-green-600">{doneCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Done</p>
        </div>
      </div>

      {/* Member cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {users.map((user) => {
          const userTickets = getTicketsForUser(user.id);
          const active = userTickets.filter((t) => t.status !== "DONE");
          const hasBlocker = userTickets.some((t) => t.status === "BLOCKED");

          return (
            <div
              key={user.id}
              className={`bg-white rounded-xl border p-4 ${
                hasBlocker ? "border-red-200" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-sm text-blue-600 font-semibold">
                    {user.name[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {active.length} active
                    {hasBlocker && (
                      <span className="text-red-500 ml-1">· blocked</span>
                    )}
                  </p>
                </div>
              </div>

              {userTickets.length === 0 ? (
                <p className="text-xs text-gray-300 py-1">
                  No tickets assigned
                </p>
              ) : (
                <div className="space-y-1.5">
                  {userTickets.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-start gap-2 py-1 border-b border-gray-50 last:border-0"
                    >
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 leading-tight ${STATUS_STYLE[t.status]}`}
                      >
                        {STATUS_LABEL[t.status]}
                      </span>
                      <p className="text-xs text-gray-700 leading-snug pt-0.5">
                        {t.title}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {unassigned.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <span className="text-sm text-gray-400 font-semibold">?</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  Unassigned
                </p>
                <p className="text-xs text-gray-400">
                  {unassigned.length} tickets
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              {unassigned.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start gap-2 py-1 border-b border-gray-50 last:border-0"
                >
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 leading-tight ${STATUS_STYLE[t.status]}`}
                  >
                    {STATUS_LABEL[t.status]}
                  </span>
                  <p className="text-xs text-gray-700 leading-snug pt-0.5">
                    {t.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
