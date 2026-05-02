import { useEffect, useState } from "react";
import { API_URL } from "../config/api";

const fmt = (d) => new Date(d).toLocaleString("ko-KR");

export function NoticePage({ currentRole }) {
  const isAdmin = currentRole === "admin" || currentRole === "super_admin";

  const [notices, setNotices]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // 작성 폼 상태
  const [showForm, setShowForm]   = useState(false);
  const [title, setTitle]         = useState("");
  const [content, setContent]     = useState("");
  const [posting, setPosting]     = useState(false);
  const [postError, setPostError] = useState("");

  const fetchNotices = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/notices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setNotices(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setPosting(true);
    setPostError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/notices`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "작성 실패");
      setTitle(""); setContent(""); setShowForm(false);
      await fetchNotices();
    } catch (e) {
      setPostError(e.message);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("공지를 삭제하시겠습니까?")) return;
    const token = localStorage.getItem("token");
    await fetch(`${API_URL}/notices/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotices((prev) => prev.filter((n) => n.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow">

          {/* 헤더 */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">공지사항</h2>
              <p className="text-sm text-gray-500 mt-1">운영자가 올린 공지사항을 확인하세요.</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => { setShowForm((s) => !s); setPostError(""); }}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  showForm
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {showForm ? "취소" : "+ 공지 작성"}
              </button>
            )}
          </div>

          {/* 공지 작성 폼 (운영자) */}
          {isAdmin && showForm && (
            <form onSubmit={handlePost} className="px-6 py-5 bg-blue-50/50 border-b border-blue-100 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="공지 제목을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용 *</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="공지 내용을 입력하세요"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              {postError && <p className="text-red-500 text-sm">{postError}</p>}
              <button
                type="submit"
                disabled={posting || !title.trim() || !content.trim()}
                className="w-full py-2.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {posting ? "등록 중..." : "공지 등록 (전체 알림 자동 발송)"}
              </button>
            </form>
          )}

          {/* 공지 목록 */}
          {loading ? (
            <div className="px-6 py-16 text-center text-gray-400">불러오는 중...</div>
          ) : notices.length === 0 ? (
            <div className="px-6 py-16 text-center text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p>등록된 공지사항이 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notices.map((notice, idx) => (
                <div key={notice.id}>
                  <button
                    onClick={() => setExpandedId(expandedId === notice.id ? null : notice.id)}
                    className="w-full px-6 py-4 flex items-start justify-between hover:bg-gray-50 transition-colors text-left gap-4"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="mt-0.5 flex-shrink-0 text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-semibold">
                        공지
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{notice.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {notice.author} · {fmt(notice.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isAdmin && (
                        <span
                          role="button"
                          onClick={(e) => { e.stopPropagation(); handleDelete(notice.id); }}
                          className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          삭제
                        </span>
                      )}
                      <span className="text-gray-400 text-sm">{expandedId === notice.id ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {expandedId === notice.id && (
                    <div className="px-6 pb-6 pt-4 border-t border-gray-100 bg-gray-50/40">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                        {notice.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
