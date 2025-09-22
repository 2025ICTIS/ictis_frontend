import {useEffect, useState} from "react";
import {LogIn, User, Lock, Eye, EyeOff, CheckCircle} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { login as loginApi } from "@/features/auth/api";

export const LoginScreen = () => {
    const { user, setUser, login: loginStore } = useAppStore();
    const [form, setForm] = useState({ username: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 진행률/모달 상태
    const [showModal, setShowModal] = useState(false);
    const [loginProgress, setLoginProgress] = useState(0);

    // user가 세팅되면 자동 로그인 애니메이션 → 3초 후 login(user)
    useEffect(() => {
        if (!user) return;

        setShowModal(true);
        // 진행률 애니메이션
        const progressInterval = setInterval(() => {
            setLoginProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + 20;
            });
        }, 200);

        // 완료 타이머(3초)
        const timer = setTimeout(() => {
            setShowModal(false);
            loginStore(user); // isLoggedIn: true & currentScreen: "home"
            setLoginProgress(0);
        }, 3000);

        return () => {
            clearTimeout(timer);
            clearInterval(progressInterval);
        };
    }, [user, loginStore]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;
        setIsLoading(true);

        const username = form.username.trim();
        const password = form.password;

        if (!username || !password) {
            alert("아이디와 비밀번호를 입력하세요.");
            setIsLoading(false);
            return;
        }

        try {
            await loginApi({ username, password });

            // 서버 응답에 맞춰 사용자/토큰을 반영하세요.
            // 데모: 최소 정보만 세팅 → useEffect가 자동 진행률/로그인 처리
            setUser({
                name: username,
                nickname: username,
                password: "",
                stamps: 0,
                reviews: 0,
                hasCompletedTest: false,
            });
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "로그인에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full relative">
            {/* 메인 로그인 화면 */}
            <div className="flex h-full items-center justify-center p-4">
                <div className="w-full">
                    <div className="mb-6 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 shadow-lg">
                            <LogIn className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">로그인</h2>
                        <p className="mt-2 text-sm text-white/80">계정 정보를 입력하세요</p>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-lg">
                        <form className="space-y-4" onSubmit={onSubmit}>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">아이디</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-4 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        autoComplete="username"
                                        required
                                        className="w-full rounded-xl border border-gray-300 py-4 pl-10 pr-4 text-base focus:border-transparent focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                                        placeholder="아이디(Username)를 입력하세요"
                                        value={form.username}
                                        onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">비밀번호</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-4 h-5 w-5 text-gray-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        className="w-full rounded-xl border border-gray-300 py-4 pl-10 pr-12 text-base focus:border-transparent focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                                        placeholder="비밀번호를 입력하세요"
                                        value={form.password}
                                        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-4 text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowPassword((v) => !v)}
                                        aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                aria-busy={isLoading}
                                className="w-full rounded-xl bg-blue-500 py-4 font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300 cursor-pointer"
                            >
                                {isLoading ? "로그인 요청 중..." : "로그인"}
                            </button>
                        </form>
                    </div>

                    {/* 기존 안내 문구 아래에 회원가입 버튼 추가 */}
                    <div className="mt-6 text-center text-sm text-white/85">
                        <p className="mb-2">계정이 없으신가요? 회원가입을 진행해 주세요.</p>
                        <button
                            type="button"
                            onClick={() => useAppStore.getState().setCurrentScreen("signup")}
                            className="cursor-pointer inline-flex items-center justify-center rounded-lg bg-white/15 px-4 py-2 text-white backdrop-blur hover:bg-white/25 transition-colors text-sm font-medium"
                        >
                            회원가입으로 이동
                        </button>
                    </div>

                </div>
            </div>

            {/* 로그인 진행/완료 모달 */}
            {showModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm p-6 mx-4 transform bg-white shadow-2xl rounded-2xl animate-scale-up">
                        <div className="text-center">
                            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-gray-900">로그인중입니다..</h3>
                            <p className="mb-6 text-gray-600">
                                <span className="font-medium text-blue-600">
                                    {user?.nickname || user?.name}
                                </span>
                                님, 환영합니다!
                            </p>

                            {/* 진행률 바 */}
                            <div className="w-full h-3 mb-4 overflow-hidden bg-gray-200 rounded-full">
                                <div
                                    className="h-3 transition-all duration-300 ease-out rounded-full bg-gradient-to-r from-blue-500 to-green-500"
                                    style={{ width: `${loginProgress}%` }}
                                />
                            </div>

                            {/* 진행률 단계 메시지 */}
                            <p className="mb-4 text-sm text-gray-500">
                                {loginProgress < 40 && "사용자 정보 로드 중..."}
                                {loginProgress >= 40 && loginProgress < 80 && "탐험 기록 불러오는 중..."}
                                {loginProgress >= 80 && "로그인 완료!"}
                            </p>

                            <div className="p-3 rounded-lg bg-blue-50">
                                <p className="text-sm text-blue-700">🎉 충청남도의 숨은 상권을 탐험해보세요!</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* scale-up 애니메이션 */}
            <style>{`
              @keyframes scale-up {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
              }
              .animate-scale-up { animation: scale-up 0.3s ease-out; }
            `}</style>
        </div>
    );
};
