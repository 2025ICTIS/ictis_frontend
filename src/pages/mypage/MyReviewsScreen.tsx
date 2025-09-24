import {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAppStore} from "@/store/useAppStore";
import {fetchMyReviews, type MyReview} from "@/features/auth/api";

type MyReviewItem = {
    id: number;
    // 서버에는 가게 식별/이미지 정보가 없으므로 placeholder 사용
    storeName?: string;
    storeImage?: string;
    content: string;
    createdAt: string;
    images?: string[];
};

export const MyReviewsScreen: React.FC = () => {
    const navigate = useNavigate();
    const {user} = useAppStore();

    const [items, setItems] = useState<MyReviewItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const fetchedRef = useRef(false);

    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        (async () => {
            try {
                setLoading(true);
                setError(null);
                // 서버에서 나의 리뷰를 조회
                const list = await fetchMyReviews(); // [{ id, createdAt(=postedTime), content }]
                // 화면 포맷으로 매핑 (가게 정보가 없으므로 placeholder 사용)
                const mapped: MyReviewItem[] = (list || [])
                    .map((it: MyReview) => ({
                        id: it.id,
                        content: it.content,
                        createdAt: it.createdAt,
                        storeName: "내 리뷰", // 서버 응답에 가게명이 없으므로 임시 라벨
                        storeImage: undefined,
                        images: [], // 서버 응답에 이미지 없음
                    }))
                    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
                setItems(mapped);
            } catch (e: any) {
                setError(e?.message || "나의 리뷰를 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const nickname = user?.nickname ?? "탐험가님";
    const title = useMemo(() => `${nickname}님의 리뷰 내역`, [nickname]);

    return (
        // AppShell이 프레임/배경/높이를 관리하므로, 여기선 꽉 채우고 내부만 스크롤
        <div className="w-full h-full flex flex-col overflow-hidden bg-white">
            {/* 헤더 */}
            <header className="px-5 py-4 shadow-sm bg-white">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-100"
                        aria-label="뒤로가기"
                    >
                        ←
                    </button>
                    <h1 className="text-base font-semibold text-gray-900">{title}</h1>
                </div>
            </header>

            {/* 메인: 내부 스크롤 */}
            <main
                className="flex-1 min-h-0 px-5 py-4 overflow-y-auto"
                style={{
                    paddingTop: "env(safe-area-inset-top)",
                    paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)", // 하단 탭 높이 고려
                }}
            >
                {loading && (
                    <ul className="space-y-3 animate-pulse">
                        {Array.from({length: 5}).map((_, i) => (
                            <li key={i} className="overflow-hidden bg-white rounded-2xl ring-1 ring-gray-200">
                                <div className="flex gap-3 p-3">
                                    <div className="w-20 h-16 bg-gray-200 rounded-xl"/>
                                    <div className="flex-1 min-w-0">
                                        <div className="h-4 w-40 bg-gray-200 rounded"/>
                                        <div className="mt-2 h-3 w-56 bg-gray-200 rounded"/>
                                        <div className="mt-2 h-3 w-24 bg-gray-200 rounded"/>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {!loading && error && (
                    <div className="mt-8 text-center">
                        <p className="text-sm text-red-600">{error}</p>
                        <button
                            onClick={() => {
                                // 재시도
                                fetchedRef.current = false;
                                setItems([]);
                                setError(null);
                                setLoading(true);
                                // 즉시 다시 트리거
                                (async () => {
                                    try {
                                        const list = await fetchMyReviews();
                                        const mapped: MyReviewItem[] = (list || [])
                                            .map((it: MyReview) => ({
                                                id: it.id,
                                                content: it.content,
                                                createdAt: it.createdAt,
                                                storeName: "내 리뷰",
                                                storeImage: undefined,
                                                images: [],
                                            }))
                                            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
                                        setItems(mapped);
                                    } catch (e: any) {
                                        setError(e?.message || "나의 리뷰를 불러오지 못했습니다.");
                                    } finally {
                                        setLoading(false);
                                    }
                                })();
                            }}
                            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white cursor-pointer"
                        >
                            다시 시도
                        </button>
                    </div>
                )}

                {!loading && !error && (items.length === 0 ? (
                    <EmptyState/>
                ) : (
                    <ul className="space-y-3">
                        {items.map((it) => (
                            <li key={it.id} className="overflow-hidden bg-white rounded-2xl ring-1 ring-gray-200">
                                <div className="flex gap-3 p-3">
                                    <div className="w-20 h-16 overflow-hidden bg-gray-200 rounded-xl shrink-0">
                                        <img
                                            src={it.images?.[0] || it.storeImage || "/images/sample/placeholder.jpg"}
                                            alt={it.storeName || "review"}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {it.storeName && (
                                            <div className="text-[15px] font-semibold truncate">{it.storeName}</div>
                                        )}
                                        <p className="mt-1 text-sm text-gray-700 line-clamp-2">{stripHash(it.content)}</p>
                                        <div className="mt-1 text-xs text-gray-500">{it.createdAt}</div>
                                        {/* 해시태그 */}
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {extractTags(it.content).map((t) => (
                                                <span
                                                    key={t}
                                                    className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700"
                                                >
                          {t}
                        </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ))}
            </main>
        </div>
    );
};

const stripHash = (txt: string) => txt.replace(/#[^\s#]+/g, "").trim();
const extractTags = (txt: string) => (txt.match(/#[^\s#]+/g) || []).slice(0, 5);

const EmptyState = () => (
    <div className="mt-16 text-center">
        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full"/>
        <p className="mt-4 text-sm text-gray-600">아직 작성한 리뷰가 없어요.</p>
        <p className="text-sm text-gray-500">탐색에서 새로운 가게를 찾아보세요!</p>
    </div>
);

export default MyReviewsScreen;