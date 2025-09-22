import { useEffect, useState } from "react";
import { LogIn, CheckCircle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export const LoginScreen = () => {
    const { user, login } = useAppStore();
    const [showModal, setShowModal] = useState(false);
    const [loginProgress, setLoginProgress] = useState(0);

    useEffect(() => {
        if (!user) return;
        let mounted = true;
        setShowModal(true);

        const progressInterval = setInterval(() => {
            if (!mounted) return;
            setLoginProgress((prev) => (prev >= 100 ? 100 : prev + 20));
        }, 200);

        const timer = setTimeout(() => {
            if (!mounted) return;
            setShowModal(false);
            login(user);
            setLoginProgress(0);
        }, 3000);

        return () => {
            mounted = false;
            clearTimeout(timer);
            clearInterval(progressInterval);
        };
    }, [user, login]);

    return (
        <div className="relative mx-auto min-h-screen max-w-sm bg-gray-50">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="w-full">
                    <div className="mb-6 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-lg">
                            <LogIn className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">로그인 중</h2>
                        <p className="mt-2 text-gray-600">잠시만 기다려주세요...</p>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-lg">
                        <div className="text-center">
                            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-green-500" />
                            <p className="mb-4 text-gray-600">자동으로 로그인하고 있습니다</p>
                            <div className="space-y-2 text-sm text-gray-500">
                                <p className="flex items-center justify-center">
                                    <span className="animate-pulse">사용자 정보 확인 중</span>
                                    <span className="ml-2">...</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 text-center text-sm text-gray-500">
                        선택하신 계정으로 자동 로그인 중입니다
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="absolute inset-0 z-50 flex min-h-screen items-center justify-center bg-gray-50 p-4">
                    <div className="animate-scale-up mx-4 w-full max-w-sm transform rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-gray-900">자동으로 로그인됩니다</h3>
                            <p className="mb-6 text-gray-600">
                                <span className="font-medium text-blue-600">{user?.nickname}</span> 님, 환영합니다!
                            </p>
                            <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300 ease-out"
                                    style={{ width: `${loginProgress}%` }}
                                />
                            </div>
                            <p className="mb-4 text-sm text-gray-500">
                                {loginProgress < 40 && "사용자 정보 로드 중..."}
                                {loginProgress >= 40 && loginProgress < 80 && "탐험 기록 불러오는 중..."}
                                {loginProgress >= 80 && "로그인 완료!"}
                            </p>
                            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                                충청남도의 숨은 상권을 탐험해보세요!
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes scale-up { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-up { animation: scale-up 0.3s ease-out; }
      `}</style>
        </div>
    );
};