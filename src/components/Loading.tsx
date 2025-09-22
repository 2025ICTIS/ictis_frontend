import { useEffect } from "react";
import { MapPin } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export const LoadingScreen = () => {
    const { setCurrentScreen } = useAppStore();

    useEffect(() => {
        const timer = setTimeout(() => {
            // 전역 상태로만 화면 전환 관리
            setCurrentScreen("signup");
        }, 3000);
        return () => clearTimeout(timer);
    }, [setCurrentScreen]);


    return (
        // AppShell이 프레임과 배경/중앙 정렬을 제공하므로, 여기선 콘텐츠만
        <div className="flex flex-col items-center justify-center w-full h-full px-5 text-center" aria-busy="true" aria-live="polite">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 shadow-lg rounded-2xl bg-white/95 sm:h-20 sm:w-20">
                <MapPin
                    className="w-8 h-8 text-sky-500 sm:h-10 sm:w-10"
                    aria-hidden="true"
                />
            </div>

            {/* 제목/설명 */}
                    <h1 className="mb-1 font-bold tracking-tight text-[clamp(22px,5vw,28px)] text-white/85">
                        충남 탐험가
                    </h1>
                    <p className="mb-7 text-[15px] leading-6 text-white/85">
                        숨은 상권을 발견하고 스탬프를 모아보세요
                    </p>

                    {/* 로딩 스피너 */}
                    <div className="flex justify-center">
                        <div
                            className="border-2 rounded-full h-7 w-7 animate-spin border-white/30 border-b-white motion-reduce:animate-none"
                            role="status"
                            aria-label="로딩 중"
                        />
                    </div>

                    <p className="mt-3 text-sm text-white/80">
                        앱을 준비하고 있습니다...
                    </p>
                </div>
    );
};