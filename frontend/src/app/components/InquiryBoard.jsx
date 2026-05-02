import { useEffect, useState, useRef, useCallback } from "react";
import { API_URL } from "../config/api";

// ── 유틸: 날짜 포맷 ──────────────────────────────────────────────────────
const fmt = (d) => new Date(d).toLocaleString("ko-KR");

// ── 댓글 스레드 ──────────────────────────────────────────────────────────
function CommentThread({ comments, onAddComment, loading }) {
  const [text, setText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await onAddComment(text.trim());
    setText("");
  };

  return (
    <div className="mt-4">
      {/* 댓글 목록 */}
      {comments.length > 0 && (
        <div className="space-y-2 mb-4">
          {comments.map((c) => {
            const isAdmin = ["admin", "super_admin"].includes(c.role);
            return (
              <div
                key={c.id}
                className={`rounded-lg px-4 py-3 ${
                  isAdmin
                    ? "bg-blue-50 border border-blue-100"
                    : "bg-gray-50 border border-gray-100"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {isAdmin && (
                    <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">운영자</span>
                  )}
                  <span className={`text-xs font-medium ${isAdmin ? "text-blue-800" : "text-gray-700"}`}>
                    {c.nickname}
                  </span>
                  <span className="text-xs text-gray-400">{fmt(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{c.content}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* 댓글 입력 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="댓글을 입력하세요..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "전송 중" : "등록"}
        </button>
      </form>
    </div>
  );
}

// ── 운영자: 공지 보내기 ──────────────────────────────────────────────────
function AdminNotificationSender({ onSent }) {
  const [open, setOpen]       = useState(false);
  const [title, setTitle]     = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget]   = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/notifications/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), targetNickname: target.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "전송 실패");
      setResult(target.trim() ? `${target}님에게 알림을 보냈습니다.` : `전체 ${data.sent}명에게 공지를 보냈습니다.`);
      setTitle(""); setMessage(""); setTarget("");
      onSent?.();
    } catch (e) {
      setResult(`오류: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div>
          <h2 className="text-base font-bold text-gray-900">📢 공지 보내기</h2>
          <p className="text-xs text-gray-500 mt-0.5">전체 공지 또는 특정 사용자에게 알림을 보냅니다.</p>
        </div>
        <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <form onSubmit={handleSend} className="px-6 pb-6 pt-2 border-t border-gray-100 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="공지 제목"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">내용 (선택)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="추가 내용"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">특정 사용자 닉네임 (비우면 전체 공지)</label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="닉네임 또는 아이디 (비우면 전체)"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {result && (
            <p className={`text-sm ${result.startsWith("오류") ? "text-red-500" : "text-green-600"}`}>{result}</p>
          )}
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "전송 중..." : "알림 보내기"}
          </button>
        </form>
      )}
    </div>
  );
}

// ── 문의 카드 (운영자 & 사용자 공용) ─────────────────────────────────────
function InquiryCard({ inq, isAdmin, onExpand, expanded, detail, commentLoading, onAddComment }) {
  const hasComments = inq.comment_count > 0;

  return (
    <div>
      <button
        onClick={() => onExpand(inq.id)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 truncate">{inq.title}</p>
            {hasComments && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                💬 {inq.comment_count}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {isAdmin ? `${inq.author} · ` : ""}{fmt(inq.created_at)}
          </p>
        </div>
        <span className="text-gray-400 ml-4">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-50 bg-gray-50/50">
          {!detail ? (
            <div className="py-8 text-center text-gray-400 text-sm">불러오는 중...</div>
          ) : (
            <>
              <p className="text-gray-700 mt-4 whitespace-pre-wrap leading-relaxed">{detail.content}</p>

              {/* 첨부 이미지 */}
              {detail.images?.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {detail.images.map((url, i) => (
                    <a key={i} href={`${API_URL.replace("/api", "")}${url}`} target="_blank" rel="noreferrer">
                      <img
                        src={`${API_URL.replace("/api", "")}${url}`}
                        alt={`첨부 ${i + 1}`}
                        className="w-32 h-32 object-cover rounded border hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              )}

              {/* 댓글 스레드 */}
              <CommentThread
                comments={detail.comments || []}
                onAddComment={onAddComment}
                loading={commentLoading}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── 운영자: 전체 문의 목록 ────────────────────────────────────────────────
function AdminInquiryList({ onNotificationUpdate }) {
  const [inquiries, setInquiries]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [expandedId, setExpandedId]       = useState(null);
  const [detailMap, setDetailMap]         = useState({});
  const [commentLoading, setCommentLoading] = useState(false);

  const fetchList = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/inquiries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "불러오기 실패");
      setInquiries(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (detailMap[id]) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/inquiries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDetailMap((m) => ({ ...m, [id]: data }));
    } catch {}
  };

  const handleAddComment = async (content) => {
    setCommentLoading(true);
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_URL}/inquiries/${expandedId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      });
      // 상세 새로고침
      const res = await fetch(`${API_URL}/inquiries/${expandedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDetailMap((m) => ({ ...m, [expandedId]: data }));
      // 목록 comment_count 갱신
      setInquiries((prev) =>
        prev.map((inq) => inq.id === expandedId ? { ...inq, comment_count: data.comments.length } : inq)
      );
      onNotificationUpdate?.();
    } catch {}
    finally { setCommentLoading(false); }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">전체 문의 목록</h2>
        <p className="text-sm text-gray-500 mt-1">운영자 전용 — 전체 문의를 확인하고 답변합니다.</p>
      </div>

      {loading ? (
        <div className="px-6 py-12 text-center text-gray-400">불러오는 중...</div>
      ) : error ? (
        <div className="px-6 py-12 text-center text-red-500">{error}</div>
      ) : inquiries.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-400">등록된 문의가 없습니다.</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {inquiries.map((inq) => (
            <InquiryCard
              key={inq.id}
              inq={inq}
              isAdmin={true}
              expanded={expandedId === inq.id}
              detail={detailMap[inq.id]}
              commentLoading={commentLoading}
              onExpand={handleExpand}
              onAddComment={handleAddComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── 사용자: 내 문의 보기 ─────────────────────────────────────────────────
function MyInquiryList({ onNotificationUpdate }) {
  const [inquiries, setInquiries]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [expandedId, setExpandedId]       = useState(null);
  const [detailMap, setDetailMap]         = useState({});
  const [commentLoading, setCommentLoading] = useState(false);

  const fetchList = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/inquiries/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setInquiries(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (detailMap[id]) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/inquiries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDetailMap((m) => ({ ...m, [id]: data }));
      // 해당 문의 열면 알림 갱신 (자동 읽음 처리됨)
      onNotificationUpdate?.();
    } catch {}
  };

  const handleAddComment = async (content) => {
    setCommentLoading(true);
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_URL}/inquiries/${expandedId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      });
      const res = await fetch(`${API_URL}/inquiries/${expandedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDetailMap((m) => ({ ...m, [expandedId]: data }));
      setInquiries((prev) =>
        prev.map((inq) => inq.id === expandedId ? { ...inq, comment_count: data.comments.length } : inq)
      );
      onNotificationUpdate?.();
    } catch {}
    finally { setCommentLoading(false); }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">내 문의 보기</h2>
        <p className="text-sm text-gray-500 mt-1">내가 작성한 문의를 확인하고 추가 댓글을 남길 수 있습니다.</p>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-center text-gray-400 text-sm">불러오는 중...</div>
      ) : inquiries.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-400 text-sm">작성한 문의가 없습니다.</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {inquiries.map((inq) => (
            <InquiryCard
              key={inq.id}
              inq={inq}
              isAdmin={false}
              expanded={expandedId === inq.id}
              detail={detailMap[inq.id]}
              commentLoading={commentLoading}
              onExpand={handleExpand}
              onAddComment={handleAddComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── 문의 작성 폼 ──────────────────────────────────────────────────────────
function InquiryForm({ onSubmitted }) {
  const [title, setTitle]       = useState("");
  const [content, setContent]   = useState("");
  const [images, setImages]     = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");
  const fileRef = useRef(null);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 모두 입력하세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", content.trim());
      images.forEach((img) => formData.append("images", img));

      const res = await fetch(`${API_URL}/inquiries`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "전송 실패");

      setSuccess(true);
      setTitle(""); setContent(""); setImages([]); setPreviews([]);
      onSubmitted?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">문의가 접수되었습니다</h3>
        <p className="text-gray-500 text-sm mb-6">운영자가 확인 후 답변드리겠습니다.</p>
        <button
          onClick={() => setSuccess(false)}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          새 문의 작성
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">문의 작성</h2>
        <p className="text-sm text-gray-500 mt-1">운영자에게 문의사항을 남겨주세요.</p>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="문의 제목을 입력하세요"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">내용 *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="문의 내용을 상세히 입력하세요"
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이미지 첨부 (선택, 최대 5장)</label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 border border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm text-gray-600 w-full"
          >
            📎 이미지 선택 (JPG, PNG, GIF, 각 5MB 이하)
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="hidden"
          />
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt={`preview-${i}`} className="w-20 h-20 object-cover rounded border" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "전송 중..." : "문의 제출"}
        </button>
      </form>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────
export function InquiryBoard({ currentRole, onNotificationUpdate }) {
  const isAdmin = currentRole === "admin" || currentRole === "super_admin";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-6 space-y-6">
        {isAdmin ? (
          <>
            <AdminNotificationSender onSent={onNotificationUpdate} />
            <AdminInquiryList onNotificationUpdate={onNotificationUpdate} />
            <InquiryForm onSubmitted={onNotificationUpdate} />
          </>
        ) : (
          <>
            <MyInquiryList onNotificationUpdate={onNotificationUpdate} />
            <InquiryForm onSubmitted={onNotificationUpdate} />
          </>
        )}
      </div>
    </div>
  );
}
