import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";

type MyReviewItem = {
    id: number;
    storeId: number;
    storeName: string;
    storeImage?: string;
    content: string;
    createdAt: string;
    images: string[];
};

export const MyReviewsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { stores, user } = useAppStore();

    const items = useMemo<MyReviewItem[]>(() => {
        const nick = user?.nickname;
        if (!nick) return [];
        return stores
            .flatMap((s) =>
                (s.reviews || [])
                    .filter((r) => r.userName === nick)
                    .map((r) => ({
                        id: r.id,
                        storeId: s.id,
                        storeName: s.name,
                        storeImage: s.image,
                        content: r.content,
                        createdAt: r.createdAt,
                        images: r.images,
                    }))
            )
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }, [stores, user?.nickname]);

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
                    <h1 className="text-base font-semibold text-gray-900">나의 리뷰 내역</h1>
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
                {items.length === 0 ? (
                    <EmptyState />
                ) : (
                    <ul className="space-y-3">
                        {items.map((it) => (
                            <li
                                key={it.id}
                                className="overflow-hidden bg-white rounded-2xl ring-1 ring-gray-200"
                            >
                                <div className="flex gap-3 p-3">
                                    <div className="w-20 h-16 overflow-hidden bg-gray-200 rounded-xl shrink-0">
                                        <img
                                            src={
                                                it.images[0] ||
                                                it.storeImage ||
                                                "/images/sample/placeholder.jpg"
                                            }
                                            alt={it.storeName}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[15px] font-semibold truncate">
                                            {it.storeName}
                                        </div>
                                        <p className="mt-1 text-sm text-gray-700 line-clamp-2">
                                            {stripHash(it.content)}
                                        </p>
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
                )}
            </main>
        </div>
    );
};

const stripHash = (txt: string) => txt.replace(/#[^\s#]+/g, "").trim();
const extractTags = (txt: string) => (txt.match(/#[^\s#]+/g) || []).slice(0, 5);

const EmptyState = () => (
    <div className="mt-16 text-center">
        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full" />
        <p className="mt-4 text-sm text-gray-600">아직 작성한 리뷰가 없어요.</p>
        <p className="text-sm text-gray-500">탐색에서 새로운 가게를 찾아보세요!</p>
    </div>
);

export default MyReviewsScreen;