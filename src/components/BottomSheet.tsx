import { useEffect, useState } from "react";

/** 슬라이드업 바텀시트 (모달형) */
export function BottomSheet({
                                open,
                                onClose,
                                children,
                                maxHeight = "75vh", // 시트 최대 높이
                            }: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxHeight?: string;
}) {
    const [mounted, setMounted] = useState(open);
    const [entered, setEntered] = useState(false);

    // mount/unmount + enter/exit 애니메이션
    useEffect(() => {
        if (open) {
            setMounted(true);
            requestAnimationFrame(() => setEntered(true));
            // 스크롤 잠금
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prev;
            };
        } else {
            setEntered(false);
            const t = setTimeout(() => setMounted(false), 280); // duration과 맞춤
            return () => clearTimeout(t);
        }
    }, [open]);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true">
            {/* 배경 */}
            <div
                className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
                    entered ? "opacity-100" : "opacity-0"
                }`}
                onClick={onClose}
            />

            {/* 시트 */}
            <div className="absolute inset-x-0 bottom-0">
                <div
                    className={`
            mx-auto w-full max-w-sm
            transform-gpu rounded-t-[28px] bg-white shadow-2xl
            transition-transform duration-300
            ${entered ? "translate-y-0" : "translate-y-full"}
          `}
                    style={{
                        maxHeight,
                        paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 그립 핸들 */}
                    <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-gray-300" />
                    <div className="px-5 py-4 overflow-auto">{children}</div>
                </div>
            </div>
        </div>
    );
}
