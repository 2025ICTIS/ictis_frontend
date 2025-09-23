import React, { useEffect } from "react";
import type { Store } from "@/store/useAppStore";

function extractTags(txt: string) {
    return (txt.match(/#[^\s#]+/g) || []).slice(0, 6);
}
function stripHash(txt: string) {
    return txt.replace(/#[^\s#]+/g, "").trim();
}

export function StoreDetail({
                                store,
                                isPlanned,
                                isReviewed,
                                onClose,
                                onAddMission,
                                onWriteReview,
                            }: {
    store: Store;
    isPlanned: boolean;
    isReviewed: boolean;
    onClose: () => void;
    onAddMission: () => void;
    onWriteReview: () => void;
}) {
    const latestReview = store.reviews?.[store.reviews.length - 1];
    const tags = latestReview ? extractTags(latestReview.content) : [];
    const body = latestReview ? stripHash(latestReview.content) : "";

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    // AppShell 내부 컨테이너가 relative 이므로, absolute로 내부만 덮습니다.
    return (
        <div className="absolute inset-0 z-[300] flex flex-col" role="dialog" aria-modal="true">
            {/* 반투명 배경 (컨테이너 내부만 덮음) */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="close-overlay" />

            {/* 내용 래퍼: 컨테이너 내부 한정 */}
            <div className="relative z-[301] h-full w-full bg-white">
                {/* 상단 헤더(AppShell과 분리된 자체 헤더) */}
                <header className="sticky top-0 z-10 px-4 py-3 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onClose}
                            className="px-2 py-1 rounded-lg hover:bg-gray-100"
                            aria-label="back"
                        >
                            ←
                        </button>
                        <h1 className="text-base font-semibold truncate">{store.name}</h1>
                        <div className="w-6" />
                    </div>
                </header>

                {/* 본문 스크롤 영역 */}
                <main className="flex-1 min-h-0 overflow-y-auto">
                    <div className="w-full h-40 bg-gray-200">
                        <img
                            src={store.image || "/images/sample/placeholder-wide.jpg"}
                            alt={store.name}
                            className="object-cover w-full h-full"
                            draggable={false}
                        />
                    </div>

                    <div className="px-4 py-4">
                        <h2 className="text-xl font-bold text-gray-900">{store.name}</h2>
                        <div className="mt-3 text-sm text-gray-600">
                            <p>
                                위치 | <span className="text-gray-700">{store.address}</span>
                            </p>
                            <p className="mt-1">
                                시간 | <span className="text-gray-700">{store.hours}</span>
                            </p>
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    <div className="px-4 py-4">
                        {!latestReview ? (
                            <div className="p-6 text-sm text-center text-gray-600 border border-gray-300 border-dashed rounded-2xl">
                                아직 리뷰가 없어요. <br /> “방문 인증하고 리뷰 쓰기”로 첫 리뷰를 남겨보세요!
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {latestReview.userName}
                                            </div>
                                            <div className="text-xs text-gray-500">{latestReview.createdAt}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500">👍 {latestReview.likes}</div>
                                </div>

                                {latestReview.images?.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mt-3">
                                        {latestReview.images.slice(0, 3).map((src, i) => (
                                            <div key={i} className="h-20 overflow-hidden bg-gray-200 rounded-lg">
                                                <img src={src} alt={`review-${i}`} className="object-cover w-full h-full" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <p className="mt-4 text-sm leading-6 text-gray-700 whitespace-pre-wrap">{body}</p>

                                {tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {tags.map((t) => (
                                            <span
                                                key={t}
                                                className="px-3 py-1 text-xs text-gray-700 bg-gray-100 rounded-full"
                                            >
                        {t}
                      </span>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <hr className="border-gray-200" />
                    <div className="h-28" />
                </main>

                {/* 하단 CTA: 컨테이너 하단 절대 고정 */}
                <div
                    className="absolute inset-x-0 z-[302] px-5"
                    style={{ bottom: "calc(16px + env(safe-area-inset-bottom))" }}
                >
                    {!isReviewed ? (
                        !isPlanned ? (
                            <button
                                onClick={onAddMission}
                                className="w-full py-4 text-white bg-pink-500 shadow-lg rounded-2xl hover:bg-pink-600"
                            >
                                방문 일정에 추가하기
                            </button>
                        ) : (
                            <button
                                onClick={onWriteReview}
                                className="w-full py-4 text-white bg-blue-700 shadow-lg rounded-2xl hover:bg-blue-800"
                            >
                                방문 인증하고 리뷰 쓰기
                            </button>
                        )
                    ) : (
                        <button
                            disabled
                            className="w-full py-4 text-gray-500 bg-gray-200 cursor-not-allowed rounded-2xl"
                        >
                            이미 방문한 곳이에요
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}