import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Board",
    end: true,
    icon: (
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
          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
        />
      </svg>
    ),
  },
  {
    to: "/daily",
    label: "Daily",
    end: false,
    icon: (
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
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z"
        />
      </svg>
    ),
  },
  {
    to: "/calendar",
    label: "Calendar",
    end: false,
    icon: (
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
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    to: "/notes",
    label: "Notes",
    end: false,
    icon: (
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
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
];

const USER_COLORS = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#10B981",
  "#06B6D4",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F59E0B",
  "#6B7280",
];

function ColorPicker({ current, onSelect, onClose }) {
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
      className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-44 z-50"
    >
      <p className="text-xs font-medium text-gray-600 mb-2">เลือกสีของคุณ</p>
      <div className="flex flex-wrap gap-1.5">
        {USER_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onSelect(c)}
            className="w-6 h-6 rounded-full transition-transform hover:scale-110 border-2"
            style={{
              backgroundColor: c,
              borderColor: current === c ? "white" : "transparent",
              outline: current === c ? `2px solid ${c}` : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const handleColorSelect = async (color) => {
    setColorPickerOpen(false);
    await api.patch("/auth/me", { color });
    updateUser({ color });
  };

  return (
    <aside className="w-52 h-screen bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
          <span className="font-bold text-gray-900 text-sm">Ticket App</span>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}

        {user?.role === "ADMIN" && (
          <div className="pt-2 border-t border-gray-100 mt-2">
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Users
            </NavLink>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-1 mb-2">
          {/* Avatar — click to open color picker */}
          <div className="relative shrink-0">
            <button
              onClick={() => setColorPickerOpen((p) => !p)}
              title="เปลี่ยนสี"
              className="w-7 h-7 rounded-full flex items-center justify-center ring-2 ring-white hover:ring-gray-300 transition-all"
              style={{ backgroundColor: user?.color || "#6B7280" }}
            >
              <span className="text-xs text-white font-semibold">
                {user?.name?.[0]?.toUpperCase()}
              </span>
            </button>
            {colorPickerOpen && (
              <ColorPicker
                current={user?.color}
                onSelect={handleColorSelect}
                onClose={() => setColorPickerOpen(false)}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-gray-800 truncate">
                {user?.name}
              </p>
              {user?.role === "ADMIN" && (
                <span className="text-xs px-1 py-0.5 rounded bg-blue-100 text-blue-600 font-semibold shrink-0 leading-none">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="w-full text-left text-xs text-gray-400 hover:text-gray-600 px-1 py-1 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
