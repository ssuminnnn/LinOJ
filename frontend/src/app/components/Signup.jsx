import { useState } from "react";

const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export function Signup({ onSignup, onSwitchToLogin }) {
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [usernameError, setUsernameError] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUsernameChange = (value) => {
    setUsername(value);
    if (value && !/^[a-zA-Z0-9]+$/.test(value)) {
      setUsernameError("아이디는 영문과 숫자만 사용할 수 있습니다.");
    } else {
      setUsernameError("");
    }
  };

  const handleNicknameBlur = async () => {
    if (!nickname.trim()) return;

    try {
      const res = await fetch("https://linoj-backend.onrender.com/api/auth/check-nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNicknameError(data.error);
      } else {
        setNicknameError("");
      }
    } catch {
      // 네트워크 오류는 최종 제출 시 처리
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (value && !passwordRegex.test(value)) {
      setPasswordError("영문, 숫자, 특수문자를 포함한 8자 이상이어야 합니다.");
    } else {
      setPasswordError("");
    }
    if (confirmPassword && value !== confirmPassword) {
      setConfirmError("비밀번호가 일치하지 않습니다.");
    } else if (confirmPassword) {
      setConfirmError("");
    }
  };

  const handleConfirmChange = (value) => {
    setConfirmPassword(value);
    if (value && value !== password) {
      setConfirmError("비밀번호가 일치하지 않습니다.");
    } else {
      setConfirmError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!username.trim() || !nickname.trim() || !password.trim() || !confirmPassword.trim()) {
      setSubmitError("모든 항목을 입력하세요.");
      return;
    }
    if (usernameError || nicknameError || passwordError || confirmError) return;

    setLoading(true);
    try {
      const res = await fetch("https://linoj-backend.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, nickname, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "회원가입 실패");
        return;
      }

      localStorage.setItem("token", data.token);
      onSignup({ nickname: data.nickname, role: data.role || "user" });
    } catch {
      setSubmitError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          LinOJ 회원가입
        </h2>
        <p className="text-gray-600 text-center mb-8">
          새로운 계정을 만들어보세요
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              아이디
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                usernameError ? "border-red-400" : "border-gray-300"
              }`}
              placeholder="영문, 숫자만 사용 가능"
            />
            {usernameError && (
              <p className="text-red-500 text-xs mt-1">{usernameError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              닉네임
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); setNicknameError(""); }}
              onBlur={handleNicknameBlur}
              className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                nicknameError ? "border-red-400" : "border-gray-300"
              }`}
              placeholder="닉네임을 입력하세요"
            />
            {nicknameError && (
              <p className="text-red-500 text-xs mt-1">{nicknameError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                passwordError ? "border-red-400" : "border-gray-300"
              }`}
              placeholder="영문, 숫자, 특수문자 포함 8자 이상"
            />
            {passwordError && (
              <p className="text-red-500 text-xs mt-1">{passwordError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호 확인
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => handleConfirmChange(e.target.value)}
              className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                confirmError ? "border-red-400" : "border-gray-300"
              }`}
              placeholder="비밀번호를 다시 입력하세요"
            />
            {confirmError && (
              <p className="text-red-500 text-xs mt-1">{confirmError}</p>
            )}
          </div>

          {submitError && (
            <p className="text-red-500 text-sm">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={loading || !!usernameError || !!nicknameError || !!passwordError || !!confirmError}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-600">이미 계정이 있으신가요? </span>
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 font-semibold hover:underline"
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}
