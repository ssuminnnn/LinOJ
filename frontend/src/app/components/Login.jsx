import { useEffect, useRef, useState } from "react";
import { API_URL } from "../config/api";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GSI_SRC = "https://accounts.google.com/gsi/client";

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    const script = existing || document.createElement("script");
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });
    if (!existing) {
      script.src = GSI_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

export function Login({ onLogin, onSwitchToSignup }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupToken, setSignupToken] = useState(null);
  const [nickname, setNickname] = useState("");
  const googleBtnRef = useRef(null);

  const finishLogin = (data) => {
    localStorage.setItem("token", data.token);
    onLogin({ nickname: data.nickname, role: data.role || "user" });
  };

  const handleGoogleCredential = async (response) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "구글 로그인 실패");
        return;
      }
      if (data.needNickname) {
        setSignupToken(data.signupToken);
        return;
      }
      finishLogin(data);
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || signupToken) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !googleBtnRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          locale: "ko",
          width: 320,
        });
      })
      .catch(() => setError("구글 로그인을 불러오지 못했습니다."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signupToken]);

  const handleNicknameSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      setError("닉네임은 2~20자로 입력하세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/google/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signupToken, nickname: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "가입 실패");
        if (res.status === 401) setSignupToken(null);
        return;
      }
      finishLogin(data);
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("아이디와 비밀번호를 입력하세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "로그인 실패");
        return;
      }

      finishLogin(data);
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (signupToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            닉네임 설정
          </h2>
          <p className="text-gray-600 text-center mb-8">
            LinOJ에서 사용할 닉네임을 입력하세요.
          </p>

          <form onSubmit={handleNicknameSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                autoFocus
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2~20자"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "가입 중..." : "가입 완료"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setSignupToken(null);
                setNickname("");
                setError("");
              }}
              className="text-gray-600 hover:underline"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          LinOJ 로그인
        </h2>
        <p className="text-gray-600 text-center mb-8">
          Linux Command Online Judge
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              아이디
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="아이디를 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {GOOGLE_CLIENT_ID && (
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-sm text-gray-500">또는</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
            <div ref={googleBtnRef} className="flex justify-center" />
          </div>
        )}

        <div className="mt-6 text-center">
          <span className="text-gray-600">계정이 없으신가요? </span>
          <button
            onClick={onSwitchToSignup}
            className="text-blue-600 font-semibold hover:underline"
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}
