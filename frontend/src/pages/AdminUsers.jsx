import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.role !== "ADMIN") return;
    api.get("/users").then((res) => {
      setUsers(res.data);
      setLoading(false);
    });
  }, [currentUser]);

  if (currentUser?.role !== "ADMIN") return <Navigate to="/" />;

  const handleRoleChange = async (userId, newRole) => {
    await api.patch(`/users/${userId}/role`, { role: newRole });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
    );
  };

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Delete user "${userName}"? This will delete all their data.`))
      return;
    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete user");
    }
  };

  return (
    <div className="min-h-full">
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200">
        <h1 className="text-sm font-semibold text-gray-900">User Management</h1>
        <span className="text-xs text-gray-400">{users.length} users</span>
      </div>

      <div className="p-6 max-w-3xl">
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">
                    Name
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">
                    Email
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">
                    Role
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: u.color || "#6B7280" }}
                        >
                          <span className="text-xs text-white font-semibold">
                            {u.name[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {u.name}
                        </span>
                        {u.id === currentUser?.id && (
                          <span className="text-xs text-gray-400">(you)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      {u.id === currentUser?.id ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                          ADMIN
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value)
                          }
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          className="text-xs text-red-400 hover:text-red-600 transition"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
