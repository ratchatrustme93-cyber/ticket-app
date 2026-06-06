import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar({
  users,
  filterAssignee,
  onFilterChange,
  onCreateClick,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
      <div className="flex items-center gap-2 mr-4">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">T</span>
        </div>
        <h1 className="text-lg font-bold text-gray-900">Ticket Board</h1>
      </div>

      <select
        value={filterAssignee}
        onChange={(e) => onFilterChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">All Members</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm text-gray-500 hidden sm:block">
          {user?.name}
        </span>
        <button
          onClick={onCreateClick}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + New Ticket
        </button>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-gray-600 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
