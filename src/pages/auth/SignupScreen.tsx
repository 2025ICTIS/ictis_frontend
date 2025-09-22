import { useState } from "react";
import { User, Lock, UserPlus, Eye, EyeOff } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { signup } from "@/features/auth/api.ts";

export const SignupScreen = () => {
    const { setCurrentScreen, setUser } = useAppStore();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [formData, setFormData] = useState({ username: "", password: "", nickname: "" });

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;
        setIsLoading(true);

        const username = formData.username.trim();
        const nickname = formData.nickname.trim();
        const password = formData.password;

        if (!username || !nickname || !password) {
            alert("모든 필드를 입력해주세요.");
            setIsLoading(false);
            return;
        }
        if (password.length < 4) {
            alert("비밀번호는 4자리 이상 입력해주세요.");
            setIsLoading(false);
            return;
        }

        try {
            // 중앙 API 모듈 사용 (status 확인)
            const result = await signup({ username, nickname, password });
            if (result.status !== 201) {
                throw new Error(`회원가입 실패 (status: ${result.status})`);
            }

            // 필요 시 응답 데이터 기반으로 상태 업데이트
            setUser({ name: username, nickname, password, stamps: 0, reviews: 0, hasCompletedTest: false });

            // 성공 모달 표시 -> 약간의 지연 후 로그인 화면으로 전환
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setCurrentScreen("login");
            }, 1200);
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "회원가입 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full">
            <div className="flex h-full items-center justify-center p-4">
                <div className="w-full">
                    <div className="mb-6 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 shadow-lg">
                            <UserPlus className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">회원가입</h2>
                        <p className="mt-2 text-sm text-white/80">정보를 입력해 계정을 생성하세요</p>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-lg">
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">아이디</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-4 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        autoComplete="username"
                                        className="w-full rounded-xl border border-gray-300 py-4 pl-10 pr-4 text-base focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        placeholder="아이디(Username)를 입력하세요"
                                        value={formData.username}
                                        onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">닉네임</label>
                                <div className="relative">
                                    <UserPlus className="absolute left-3 top-4 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded-xl border border-gray-300 py-4 pl-10 pr-4 text-base focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        placeholder="닉네임을 입력하세요"
                                        value={formData.nickname}
                                        onChange={(e) => setFormData((p) => ({ ...p, nickname: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">비밀번호</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-4 h-5 w-5 text-gray-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        minLength={4}
                                        autoComplete="new-password"
                                        className="w-full rounded-xl border border-gray-300 py-4 pl-10 pr-12 text-base focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        placeholder="비밀번호를 입력하세요"
                                        value={formData.password}
                                        onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
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
                                <p className="mt-1 text-xs text-gray-500">4자리 이상 입력해주세요</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                aria-busy={isLoading}
                                className="w-full rounded-xl bg-blue-500 py-4 font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300 cursor-pointer"
                            >
                                {isLoading ? "가입 중..." : "회원가입"}
                            </button>
                        </form>
                    </div>

                    <div className="mt-6 text-center text-sm text-white/85">
                        가입하시면 충청도의 숨은 맛집과 상권을 발견할 수 있습니다
                    </div>

                    {/* 이미 계정이 있는 경우 로그인 이동 */}
                    <div className="mt-3 text-center">
                        <button
                            type="button"
                            className="text-sm font-medium text-white underline underline-offset-4 hover:text-white/90 cursor-pointer"
                            onClick={() => setCurrentScreen("login")}
                        >
                            이미 계정이 있으신가요? 로그인
                        </button>
                    </div>
                </div>
            </div>

            {/* 성공 모달 */}
            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-[88%] max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <svg className="h-7 w-7 text-green-600" viewBox="0 0 24 24" fill="none">
                                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">회원가입 성공</h3>
                        <p className="mt-1 text-sm text-gray-600">이제 로그인 화면으로 이동합니다.</p>
                    </div>
                </div>
            )}
        </div>
    );
};