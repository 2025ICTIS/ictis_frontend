import {useEffect, useMemo, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {type SearchStoreItem, searchStoresByAddress} from "@/features/search/api";
import {StoreDetail} from "@/pages/explore/StoreDetail.tsx";
import {useAppStore} from "@/store/useAppStore.ts";
// ... existing code ...
export default function SearchStoreScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const initKeyword = (location.state as any)?.q ?? "";

    const [q, setQ] = useState(initKeyword);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [list, setList] = useState<SearchStoreItem[]>([]);
    // 상세 오버레이용 상태
    const [activeStoreId, setActiveStoreId] = useState<number | null>(null);

    const plannedVisitIds = useAppStore((s) => s.plannedVisitIds);
    const reviewedStoreIds = useAppStore((s) => s.reviewedStoreIds);
    const addPlannedVisit = useAppStore((s) => s.addPlannedVisit);
    // 전역 stores에 검색 상점이 없으면 추가하기 위해 가져옴
    const stores = useAppStore((s) => s.stores);
    const setStores = useAppStore((s) => s.setStores);

    useEffect(() => {
        console.log("plannedVisitIds", plannedVisitIds)
    }, [plannedVisitIds]);
    const count = list.length;
    const disabled = !q.trim();

    const handleSearch = async () => {
        if (!q.trim()) return;
        try {
            setLoading(true);
            setError(null);
            console.log("q: ", q.trim())
            const data = await searchStoresByAddress(q.trim());
            setList(data ?? []);
        } catch (e: any) {
            setError(e?.message || "검색에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddMission = () => {
        if (!activeStore) return;
        // 1) 방문 일정에 추가 (id를 number로 강제)
        const idNum = Number(activeStore.id);
        addPlannedVisit(idNum);

        // 2) 전역 stores에 없으면 추가
        const exists = stores.some((st) => st.id === idNum);
        if (!exists) {
            const storeToAdd = {
                id: idNum,
                name: activeStore.name,
                category: activeStore.category,
                district: activeStore.district,
                address: activeStore.address,
                hours: activeStore.hours,
                image: activeStore.image,
                description: activeStore.description,
                // Store 타입에 맞는 좌표 키 사용 (longitude)
                latitude: activeStore.latitude,
                longitude: typeof (activeStore as any).longtitude === "number"
                    ? (activeStore as any).longtitude
                    : activeStore.longtitude,
                // 필수 필드
                reviews: [],
                visitCount: 0,
            };
            setStores([...stores, storeToAdd]);
        }

        setActiveStoreId(null);
    };

    const handleWriteReview = () => {
        if (!activeStore) return;
        navigate(`/review/new/${activeStore.id}`);
        setActiveStoreId(null);
    };

    // Enter 키로 검색
    const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
        }
    };

    const pretty = useMemo(
        () =>
            list.map((s) => ({
                id: Number(s.id),
                name: s.name,
                address: s.address,
                hours: s.hours,
                lat: typeof s.latitude === "number" ? s.latitude : undefined,
                lng: typeof s.longtitude === "number" ? s.longtitude : undefined,
                // 설명/보드 등 필요한 경우 사용
            })),
        [list]
    );

    // StoreDetail에 맞는 형태로 최소 매핑
    const activeStore = useMemo(() => {
        if (!activeStoreId) return null;
        const src = list.find((s) => Number(s.id) === Number(activeStoreId));
        if (!src) return null;

        // 주소 앞부분으로 대략적인 지역(district) 유추
        const district =
            typeof src.address === "string"
                ? src.address.split(" ").slice(0, 2).join(" ")
                : "";

        return {
            id: Number(src.id),
            name: src.name,
            address: src.address,
            hours: src.hours ?? "정보없음",
            latitude: src.latitude,
            longtitude: src.longtitude, // StoreDetail에서만 사용
            // StoreDetail에서 사용할 수 있는 필드들(없으면 기본값)
            image: undefined as string | undefined,
            category: undefined as string | undefined,
            visitCount: 0 as number | 0,
            reviews: [],
            district,
            description: src.description ?? "",
        };
    }, [activeStoreId, list]);

    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-white">
            {/* 헤더 */}
            <header className="px-4 py-3 shadow-sm bg-white sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-100"
                        aria-label="뒤로가기"
                    >
                        ←
                    </button>
                    <h1 className="text-base font-semibold text-gray-900">장소 검색</h1>
                </div>
                <div className="mt-3 flex gap-2">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="지역 이름 일부를 입력하세요 (예: 대전광역시 유성구)"
                        className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={disabled || loading}
                        className={`rounded-xl px-4 py-2 text-sm font-medium ${
                            disabled || loading
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                        }`}
                    >
                        검색
                    </button>
                </div>
            </header>

            {/* 본문 */}
            <main
                className="flex-1 min-h-0 overflow-y-auto px-4 pb-4"
                style={{
                    paddingTop: "env(safe-area-inset-top)",
                    paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)"
                }}
            >
                {loading && <p className="mt-4 text-sm text-gray-500">검색 중...</p>}
                {!!error && <p className="mt-4 text-sm text-red-600">{error}</p>}

                {!loading && !error && (
                    <>
                        <div className="mt-3 text-xs text-gray-500">검색 결과: {count}곳</div>
                        {count === 0 ? (
                            <div className="mt-8 text-center text-sm text-gray-600">
                                조건에 맞는 결과가 없습니다. 검색어를 변경해 보세요.
                            </div>
                        ) : (
                            <ul className="mt-3 space-y-3">
                                {pretty.map((s) => (
                                    <li
                                        key={s.id}
                                        className="rounded-2xl ring-1 ring-gray-200 bg-white overflow-hidden cursor-pointer hover:ring-gray-300 transition-colors"
                                        onClick={() => setActiveStoreId(Number(s.id))}
                                    >
                                        <div className="p-3">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-[15px] font-semibold text-gray-900">{s.name}</div>
                                                <div className="text-xs text-gray-500">{s.address}</div>
                                                <div className="text-xs text-gray-500">
                                                    운영시간 | {s.hours || "정보없음"}
                                                </div>
                                            </div>
                                            <div className="mt-3 flex gap-2">
                                                {/* 추가 액션 버튼이 필요하면 여기에 배치 */}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </main>

            {/* 상세 오버레이 */}
            {activeStore && (
                <StoreDetail
                    key={activeStore.id}
                    store={activeStore}
                    isPlanned={plannedVisitIds.includes(Number(activeStore.id))}
                    isReviewed={reviewedStoreIds.includes(Number(activeStore.id))}
                    onClose={() => setActiveStoreId(null)}
                    onAddMission={handleAddMission}
                    onWriteReview={handleWriteReview}
                />
            )}
        </div>
    );
}