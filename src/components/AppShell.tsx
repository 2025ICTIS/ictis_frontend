import type {PropsWithChildren} from "react";

export function AppShell({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-[100dvh] w-full items-center justify-center bg-neutral-100 px-4">
            <div
                className={`
          w-full max-w-[420px]
          h-[100dvh] sm:h-[820px]
          sm:rounded-[28px] sm:shadow-2xl sm:overflow-hidden
          bg-gradient-to-br from-sky-500 to-indigo-600
          overflow-hidden
        `}
            >
                {/* 콘텐츠 영역: 스크롤 방지 위해 고정 높이 + 오버플로우 숨김 */}
                <div className="relative flex h-full min-h-0 w-full flex-col">
                    {children}
                </div>
            </div>
        </div>
    );
}