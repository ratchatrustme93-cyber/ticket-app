import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import { getHolidayMap } from "../data/thaiHolidays";

const WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const MONTHS_TH = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const STATUS_DOT = {
  TODO: "bg-gray-400",
  IN_PROGRESS: "bg-blue-500",
  BLOCKED: "bg-red-500",
  DONE: "bg-green-500",
};
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

export default function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tickets, setTickets] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    api.get("/tickets").then((res) => setTickets(res.data));
  }, []);

  const holidayMap = useMemo(() => getHolidayMap(year), [year]);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
    setSelectedDay(null);
  };
  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDay(now.getDate());
  };

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const toDateKey = (day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const getTicketsForDay = (day) => {
    if (!day) return [];
    const key = toDateKey(day);
    return tickets.filter((t) => t.dueDate && t.dueDate.slice(0, 10) === key);
  };

  const getHolidaysForDay = (day) => {
    if (!day) return [];
    return holidayMap.get(toDateKey(day)) || [];
  };

  const isToday = (day) =>
    day &&
    year === now.getFullYear() &&
    month === now.getMonth() &&
    day === now.getDate();

  const isSunday = (day) => {
    if (!day) return false;
    return new Date(year, month, day).getDay() === 0;
  };

  const selectedTickets = selectedDay ? getTicketsForDay(selectedDay) : [];
  const selectedHolidays = selectedDay ? getHolidaysForDay(selectedDay) : [];

  const monthTickets = tickets.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const overdueCount = tickets.filter((t) => {
    if (!t.dueDate || t.status === "DONE") return false;
    return new Date(t.dueDate) < new Date(now.toDateString());
  }).length;

  // Holidays in this month for legend
  const monthHolidays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const hs = getHolidaysForDay(d);
    if (hs.length > 0) monthHolidays.push({ day: d, holidays: hs });
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ปฏิทิน</h1>
          {overdueCount > 0 && (
            <p className="text-xs text-red-500 mt-0.5">
              เกินกำหนด {overdueCount} ticket
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 font-medium transition"
          >
            วันนี้
          </button>
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-800 w-40 text-center">
            {MONTHS_TH[month]} {year + 543}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition"
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={`py-2 text-center text-xs font-semibold ${
                i === 0
                  ? "text-red-400"
                  : i === 6
                    ? "text-blue-400"
                    : "text-gray-400"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-50">
          {cells.map((day, i) => {
            const dayTickets = getTicketsForDay(day);
            const dayHolidays = getHolidaysForDay(day);
            const isHoliday = dayHolidays.length > 0;
            const isSelected = day === selectedDay;
            const isSun = isSunday(day);
            const hasOverdue = dayTickets.some(
              (t) =>
                t.status !== "DONE" &&
                new Date(t.dueDate) < new Date(now.toDateString()),
            );

            return (
              <div
                key={i}
                onClick={() => day && setSelectedDay(isSelected ? null : day)}
                className={`min-h-24 p-1.5 transition-colors ${
                  day
                    ? `cursor-pointer ${
                        isSelected
                          ? "bg-blue-50"
                          : isHoliday
                            ? "bg-red-50/40 hover:bg-red-50"
                            : "hover:bg-gray-50"
                      }`
                    : "bg-gray-50/30"
                }`}
              >
                {day && (
                  <>
                    {/* Date number */}
                    <div className="flex items-center gap-1 mb-1">
                      <div
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium shrink-0 ${
                          isToday(day)
                            ? "bg-blue-600 text-white"
                            : isHoliday || isSun
                              ? "text-red-500 font-semibold"
                              : hasOverdue
                                ? "text-orange-500"
                                : "text-gray-700"
                        }`}
                      >
                        {day}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      {/* Holidays — show first */}
                      {dayHolidays.slice(0, 2).map((h, hi) => (
                        <div
                          key={hi}
                          className="flex items-center gap-1 min-w-0"
                        >
                          <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-red-400" />
                          <p className="text-xs text-red-500 truncate leading-tight font-medium">
                            {h.name}
                          </p>
                        </div>
                      ))}

                      {/* Tickets */}
                      {dayTickets.slice(0, 2).map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-1 min-w-0"
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[t.status]}`}
                          />
                          <p className="text-xs text-gray-600 truncate leading-tight">
                            {t.title}
                          </p>
                        </div>
                      ))}

                      {/* Overflow count */}
                      {dayHolidays.length + dayTickets.length > 4 && (
                        <p className="text-xs text-gray-400">
                          +{dayHolidays.length + dayTickets.length - 4} more
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">
              {selectedDay} {MONTHS_TH[month]} {year + 543}
            </h3>
            <span className="text-xs text-gray-400">
              {selectedHolidays.length > 0 &&
                `${selectedHolidays.length} วันหยุด · `}
              {selectedTickets.length} ticket
            </span>
          </div>

          {/* Holidays in this day */}
          {selectedHolidays.length > 0 && (
            <div className="mb-3 pb-3 border-b border-gray-100 space-y-1.5">
              {selectedHolidays.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  <span className="text-sm text-red-600 font-medium">
                    {h.name}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {h.type === "buddhist"
                      ? "วันสำคัญทางพุทธ"
                      : "วันหยุดราชการ"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tickets */}
          {selectedTickets.length === 0 ? (
            <p className="text-sm text-gray-400">ไม่มี ticket ครบกำหนดวันนี้</p>
          ) : (
            <div className="space-y-2">
              {selectedTickets.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0"
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[t.status]}`}
                  />
                  <p className="text-sm text-gray-800 flex-1 truncate">
                    {t.title}
                  </p>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${STATUS_STYLE[t.status]}`}
                  >
                    {STATUS_LABEL[t.status]}
                  </span>
                  {t.assignee && (
                    <span className="text-xs text-gray-400 shrink-0">
                      {t.assignee.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Month holidays list */}
      {monthHolidays.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            วันหยุดเดือน{MONTHS_TH[month]}
          </h3>
          <div className="space-y-1.5">
            {monthHolidays.map(({ day, holidays }) =>
              holidays.map((h, i) => (
                <div key={`${day}-${i}`} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-6 text-right shrink-0">
                    {day}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span className="text-sm text-gray-700">{h.name}</span>
                </div>
              )),
            )}
          </div>
        </div>
      )}

      {monthTickets.length > 0 && (
        <p className="mt-3 text-xs text-gray-400 text-right">
          มี ticket ครบกำหนด {monthTickets.length} รายการเดือนนี้
        </p>
      )}
    </div>
  );
}
