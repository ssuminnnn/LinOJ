import { useEffect, useState } from "react";

const API = "http://localhost:3001/api";

export function InquiryBoard() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("인증이 필요합니다.");
      setLoading(false);
      return;
    }

    fetch(`${API}/inquiries`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "문의 목록을 불러오지 못했습니다.");
        setInquiries(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">문의 게시판</h2>
            <p className="text-sm text-gray-600 mt-1">운영자만 문의 내용을 확인할 수 있습니다.</p>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">불러오는 중...</div>
          ) : error ? (
            <div className="px-6 py-12 text-center text-red-500">{error}</div>
          ) : inquiries.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">등록된 문의가 없습니다.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {inquiries.map((inquiry) => (
                <article key={inquiry.id} className="px-6 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{inquiry.title}</h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(inquiry.created_at).toLocaleString("ko-KR")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">작성자: {inquiry.author}</p>
                  <p className="text-gray-700 mt-3 whitespace-pre-wrap">{inquiry.content}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
