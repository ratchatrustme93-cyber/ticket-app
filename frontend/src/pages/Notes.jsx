import { useState, useEffect, useRef } from "react";
import api from "../services/api";

function PinIcon({ filled }) {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Notes() {
  const [memos, setMemos] = useState([]);
  const [editing, setEditing] = useState(null); // { id, title, content, pinned } | null
  const [isNew, setIsNew] = useState(false);
  const [search, setSearch] = useState("");
  const titleRef = useRef(null);

  useEffect(() => {
    api.get("/memos").then((res) => setMemos(res.data));
  }, []);

  useEffect(() => {
    if (editing !== null) {
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [editing?.id]);

  const openNew = () => {
    setEditing({ id: null, title: "", content: "", pinned: false });
    setIsNew(true);
  };

  const openEdit = (memo) => {
    setEditing({ ...memo });
    setIsNew(false);
  };

  const closeEditor = () => {
    setEditing(null);
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!editing.title.trim() && !editing.content.trim()) {
      closeEditor();
      return;
    }
    if (isNew) {
      const res = await api.post("/memos", editing);
      setMemos((prev) => [res.data, ...prev]);
    } else {
      const res = await api.put(`/memos/${editing.id}`, editing);
      setMemos((prev) => prev.map((m) => (m.id === editing.id ? res.data : m)));
    }
    closeEditor();
  };

  const togglePin = async (e, memo) => {
    e.stopPropagation();
    const res = await api.put(`/memos/${memo.id}`, { pinned: !memo.pinned });
    setMemos((prev) =>
      prev
        .map((m) => (m.id === memo.id ? res.data : m))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.updatedAt) - new Date(a.updatedAt))
    );
  };

  const deleteMemo = async (e, id) => {
    e.stopPropagation();
    if (!confirm("ลบ note นี้?")) return;
    await api.delete(`/memos/${id}`);
    setMemos((prev) => prev.filter((m) => m.id !== id));
    if (editing?.id === id) closeEditor();
  };

  const filtered = memos.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.content.toLowerCase().includes(search.toLowerCase())
  );

  const pinned = filtered.filter((m) => m.pinned);
  const unpinned = filtered.filter((m) => !m.pinned);

  return (
    <div className="flex h-full">
      {/* Notes list */}
      <div className={`flex flex-col ${editing ? "w-80 shrink-0 border-r border-gray-200" : "flex-1"}`}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200">
          <h1 className="text-sm font-semibold text-gray-900 mr-1">Notes</h1>
          <div className="flex-1 relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="ค้นหา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={openNew}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap"
          >
            + New
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-gray-300">
              <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">{search ? "ไม่พบ note" : "ยังไม่มี note"}</p>
            </div>
          )}

          {pinned.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
                ปักหมุด
              </p>
              <div className={`grid gap-2 ${editing ? "grid-cols-1" : "grid-cols-2 xl:grid-cols-3"}`}>
                {pinned.map((m) => (
                  <MemoCard
                    key={m.id}
                    memo={m}
                    active={editing?.id === m.id}
                    onClick={() => openEdit(m)}
                    onPin={togglePin}
                    onDelete={deleteMemo}
                  />
                ))}
              </div>
            </div>
          )}

          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
                  ทั้งหมด
                </p>
              )}
              <div className={`grid gap-2 ${editing ? "grid-cols-1" : "grid-cols-2 xl:grid-cols-3"}`}>
                {unpinned.map((m) => (
                  <MemoCard
                    key={m.id}
                    memo={m}
                    active={editing?.id === m.id}
                    onClick={() => openEdit(m)}
                    onPin={togglePin}
                    onDelete={deleteMemo}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor panel */}
      {editing !== null && (
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
            <span className="text-xs text-gray-400">
              {isNew ? "Note ใหม่" : `แก้ไขล่าสุด ${formatDate(memos.find(m=>m.id===editing.id)?.updatedAt || new Date())}`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  if (editing.id) togglePin(e, editing);
                  else setEditing((p) => ({ ...p, pinned: !p.pinned }));
                }}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition ${
                  editing.pinned
                    ? "bg-amber-50 border-amber-300 text-amber-600"
                    : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
                }`}
              >
                <PinIcon filled={editing.pinned} />
                {editing.pinned ? "ปักหมุดอยู่" : "ปักหมุด"}
              </button>
              {!isNew && (
                <button
                  onClick={(e) => deleteMemo(e, editing.id)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400 transition"
                >
                  <TrashIcon />
                  ลบ
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col px-6 py-4 gap-3 overflow-hidden">
            <input
              ref={titleRef}
              type="text"
              placeholder="หัวข้อ..."
              value={editing.title}
              onChange={(e) => setEditing((p) => ({ ...p, title: e.target.value }))}
              className="text-xl font-semibold text-gray-900 placeholder-gray-300 focus:outline-none border-b border-gray-100 pb-3"
            />
            <textarea
              placeholder="เขียน note ที่นี่..."
              value={editing.content}
              onChange={(e) => setEditing((p) => ({ ...p, content: e.target.value }))}
              className="flex-1 text-sm text-gray-700 placeholder-gray-300 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-gray-100">
            <button
              onClick={closeEditor}
              className="text-sm text-gray-400 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              บันทึก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MemoCard({ memo, active, onClick, onPin, onDelete }) {
  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl border p-3 cursor-pointer transition-all ${
        active
          ? "border-blue-300 bg-blue-50"
          : memo.pinned
          ? "border-amber-200 bg-amber-50/40 hover:border-amber-300"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      {memo.pinned && (
        <div className="absolute top-2 right-2 text-amber-400">
          <PinIcon filled />
        </div>
      )}
      <p className={`text-sm font-semibold text-gray-800 mb-1 leading-snug ${memo.pinned ? "pr-5" : ""} ${!memo.title && "text-gray-300 font-normal italic"}`}>
        {memo.title || "ไม่มีหัวข้อ"}
      </p>
      {memo.content && (
        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">{memo.content}</p>
      )}
      <p className="text-xs text-gray-300 mt-2">{formatDate(memo.updatedAt)}</p>

      {/* Hover actions */}
      <div className="absolute bottom-2 right-2 hidden group-hover:flex items-center gap-1">
        <button
          onClick={(e) => onPin(e, memo)}
          className={`p-1 rounded hover:bg-white/80 transition ${memo.pinned ? "text-amber-500" : "text-gray-400 hover:text-amber-500"}`}
          title={memo.pinned ? "เอาออก" : "ปักหมุด"}
        >
          <PinIcon filled={memo.pinned} />
        </button>
        <button
          onClick={(e) => onDelete(e, memo.id)}
          className="p-1 rounded hover:bg-white/80 text-gray-300 hover:text-red-400 transition"
          title="ลบ"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
