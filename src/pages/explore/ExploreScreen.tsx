import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { MapPin, ChevronDown, Search, CheckCircle2 } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import { useLocation, useNavigate } from "react-router-dom";

/* ======================================================
 * 공통 태그 칩
 * ====================================================== */
function Tag({ children }: { children: React.ReactNode }) {
    return (
        <span className="px-3 py-1 text-xs text-gray-700 rounded-full shadow bg-white/90 ring-1 ring-black/5">
      {children}
    </span>
    );
}

/* ======================================================
 * 무한 슬라이드 캐러셀 (터치/마우스 스와이프 + 탭 감지)
 * ====================================================== */
function InfiniteStoreCarousel({
                                   items,
                                   onCardClick,
                               }: {
    items: {
        id: number;
        name: string;
        image?: string;
        district: string;
        category: string;
    }[];
    onCardClick: (id: number) => void;
}) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [wrapW, setWrapW] = useState(0);

    // 2개 이상일 때만 클론 확장
    const slides =
        items.length > 1
            ? [items[items.length - 1], ...items, items[0]]
            : [...items];

    const [index, setIndex] = useState(items.length > 1 ? 1 : 0); // 실제 첫 슬라이드
    const [animate, setAnimate] = useState(true);

    // 드래그 상태
    const [dragging, setDragging] = useState(false);
    const [startX, setStartX] = useState<number | null>(null);
    const [deltaX, setDeltaX] = useState(0);

    useEffect(() => {
        const resize = () =>
            setWrapW(wrapRef.current?.getBoundingClientRect().width || 0);
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    // 무한 루프 점프
    const handleTransitionEnd = () => {
        if (items.length <= 1) return;
        if (index === slides.length - 1) {
            setAnimate(false);
            setIndex(1);
        } else if (index === 0) {
            setAnimate(false);
            setIndex(slides.length - 2);
        }
    };
    useEffect(() => {
        if (!animate) {
            const t = setTimeout(() => setAnimate(true), 20);
            return () => clearTimeout(t);
        }
    }, [animate]);

    // 현재 index → 실제 items 매핑
    const realItemAt = (i: number) => {
        if (items.length <= 1) return items[0];
        if (i === 0) return items[items.length - 1];
        if (i === slides.length - 1) return items[0];
        return items[i - 1];
    };

    // Pointer 이벤트
    const onPointerDown = (e: React.PointerEvent) => {
        setDragging(true);
        setStartX(e.clientX);
        setDeltaX(0);
    };
    const onPointerMove = (e: React.PointerEvent) => {
        if (!dragging || startX == null) return;
        setDeltaX(e.clientX - startX);
    };
    const finishGesture = () => {
        setDragging(false);
        setStartX(null);
        setDeltaX(0);
    };
    const onPointerUp = () => {
        if (startX == null) return;

        const SWIPE_THRESHOLD = Math.min(80, wrapW * 0.2);
        const TAP_THRESHOLD = 8; // px : 이 값 이하 움직이면 탭으로 간주

        // 탭 처리
        if (Math.abs(deltaX) < TAP_THRESHOLD) {
            const target = realItemAt(index);
            if (target) onCardClick(target.id);
            return finishGesture();
        }

        // 스와이프 처리
        if (deltaX < -SWIPE_THRESHOLD)
            setIndex((i) => Math.min(i + 1, slides.length - 1));
        else if (deltaX > SWIPE_THRESHOLD) setIndex((i) => Math.max(i - 1, 0));

        finishGesture();
    };

    const translateX = -(index * wrapW) + deltaX;
    const trackW = slides.length * wrapW;

    return (
        <div ref={wrapRef} className="relative w-full overflow-hidden">
            <div
                className="flex select-none"
                style={{
                    width: `${trackW}px`,
                    transform: `translate3d(${translateX}px, 0, 0)`,
                    transition: animate && !dragging ? "transform 300ms ease" : "none",
                    touchAction: "pan-y",
                    cursor: dragging ? "grabbing" : "grab",
                }}
                onTransitionEnd={handleTransitionEnd}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onPointerLeave={dragging ? onPointerUp : undefined}
            >
                {slides.map((s, i) => (
                    <div
                        key={`${s?.id ?? "empty"}-${i}`}
                        style={{ width: wrapW }}
                        className="px-1 shrink-0"
                    >
                        {/* 버튼 onClick 제거 (탭은 제스처로 처리) */}
                        <div className="relative mx-auto h-64 w-[280px] overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5">
                            <img
                                src={s?.image || "/images/sample/placeholder.jpg"}
                                alt={s?.name ?? "store"}
                                className="object-cover w-full h-full pointer-events-none"
                                draggable={false}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                            <div className="absolute flex gap-2 left-3 top-3">
                                <Tag>뷰맛집</Tag>
                                <Tag>인테리어</Tag>
                                <Tag>신선함</Tag>
                            </div>
                            <div className="absolute bottom-3 left-3 right-3">
                                <p className="text-sm text-white/80">
                                    {s?.district} · {s?.category}
                                </p>
                                <h3 className="text-lg font-semibold text-white truncate">
                                    {s?.name}
                                </h3>
                                <p className="mt-1 text-xs line-clamp-1 text-white/80">
                                    이색체험 찾는다면 추천합니다…
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 인디케이터 */}
            {items.length > 0 && (
                <div className="absolute -translate-x-1/2 left-1/2 bottom-2">
                    <div className="flex gap-1.5 rounded-full bg-black/5 px-2 py-1">
                        {items.map((_, i) => {
                            const real =
                                items.length <= 1
                                    ? 1
                                    : index === 0
                                        ? items.length
                                        : index === items.length + 1
                                            ? 1
                                            : index;
                            return (
                                <span
                                    key={i}
                                    className={`h-1.5 w-1.5 rounded-full transition ${
                                        real === i + 1 ? "bg-gray-900" : "bg-gray-400/50"
                                    }`}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

/* 유틸: 리뷰 텍스트와 해시태그 */
const extractTags = (txt: string) => (txt.match(/#[^\s#]+/g) || []).slice(0, 6);
const stripHash = (txt: string) => txt.replace(/#[^\s#]+/g, "").trim();

/* ======================================================
 * 메인: ExploreScreen
 *  - “미션(목표)+일정(예정)” 통합 리스트 + 완료 체크 + 완료수 기준 진행도
 * ====================================================== */
export const ExploreScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Zustand selector로 필요한 값만 구독
    const stores = useAppStore((s) => s.stores);
    const seedStores = useAppStore((s) => s.seedStores);
    const plannedVisitIds = useAppStore((s) => s.plannedVisitIds);
    const visitedStoreIds = useAppStore((s) => s.visitedStoreIds); // 완료 목록
    const reviewedStoreIds = useAppStore((s) => s.reviewedStoreIds);
    const addPlannedVisit = useAppStore((s) => s.addPlannedVisit);
    const user = useAppStore((s) => s.user);

    useEffect(() => {
        seedStores(); // 데모 스토어 주입
    }, [seedStores]);

    const data = stores;

    const [activeStoreId, setActiveStoreId] = useState<number | null>(null);
    const activeStore = useMemo(
        () => data.find((s) => s.id === activeStoreId) || null,
        [data, activeStoreId]
    );

    const [sheetType, setSheetType] = useState<
        "add-mission" | "write-review" | null
    >(null);
    const closeSheet = () => setSheetType(null);

    /* ===================== 통합 일정 리스트 =====================
       planned + visited 을 합치고, 중복 제거(Set) → store 객체로 매핑
    */
    const scheduleCards = useMemo(() => {
        if (!data?.length) return [];
        const ids = Array.from(new Set([...plannedVisitIds, ...visitedStoreIds]));
        return ids
            .map((id) => data.find((s) => s.id === id))
            .filter((s): s is (typeof data)[number] => !!s);
        // 선택: 완료된 항목은 아래로/위로 정렬하고 싶다면 주석 해제
        // .sort((a, b) => {
        //   const doneA = visitedStoreIds.includes(a.id) ? 1 : 0;
        //   const doneB = visitedStoreIds.includes(b.id) ? 1 : 0;
        //   return doneA - doneB; // 미완료 먼저, 완료 나중
        // })
    }, [plannedVisitIds, visitedStoreIds, data]);

    // 진행도: 완료(visited) 수 기준
    const missionGoal = 10;
    const completedCount = visitedStoreIds.length;
    const progress = Math.min(
        100,
        Math.round((completedCount / missionGoal) * 100)
    );

    const isPlanned = activeStore
        ? plannedVisitIds.includes(activeStore.id)
        : false;
    const isReviewed = activeStore
        ? reviewedStoreIds.includes(activeStore.id)
        : false;

    /* ------------------------ 리스트 뷰 ------------------------ */
    if (!activeStore) {
        return (
            <div
                className="mx-auto flex min-h-[100dvh] max-w-[420px] flex-col bg-white"
                style={{
                    paddingTop: "env(safe-area-inset-top)",
                    paddingBottom: "calc(env(safe-area-inset-bottom) + 64px)",
                }}
            >
                {/* 헤더 */}
                <header className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-white">
                    <div className="flex items-center justify-between">
                        <button className="flex items-center gap-1 text-sm text-gray-700">
                            <MapPin className="w-4 h-4" />
                            <span>충청도 전체</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-full hover:bg-gray-100">
                            <Search className="w-5 h-5 text-gray-700" />
                        </button>
                    </div>
                </header>

                {/* 메인 */}
                <main className="flex flex-1 min-h-0 px-4 pb-4 overflow-y-auto">
                    <div className="w-full space-y-6">
                        {/* 상단 캐러셀 */}
                        <section>
                            <h2 className="mb-3 text-xl font-bold text-gray-900">
                                7월의 숨은 가게 탐색
                            </h2>
                            <InfiniteStoreCarousel
                                items={data}
                                onCardClick={(id) => setActiveStoreId(id)}
                            />
                        </section>

                        {/* 통합 일정 + 진행도 */}
                        <section className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {user?.nickname ?? "회원"}님의 7월 방문 일정
                            </h3>
                            <p className="text-sm text-gray-500">
                                미션(방문 목표)과 예정 일정을 통합해서 보여드려요. 완료된 곳은
                                체크로 표시돼요.
                            </p>

                            {/* 진행도 (완료 수 기준) */}
                            <div>
                                <div className="w-full h-2 bg-gray-200 rounded-full">
                                    <div
                                        className="h-2 bg-pink-500 rounded-full"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="mt-1 text-xs text-right text-gray-500">
                                    완료 {completedCount} / 목표 {missionGoal}
                                </div>
                            </div>

                            {/* 일정 리스트 */}
                            {scheduleCards.length === 0 ? (
                                <div className="p-6 text-center border border-gray-300 border-dashed rounded-2xl">
                                    <p className="text-sm text-gray-600">
                                        아직 등록한 방문 일정이 없어요.
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        위의 카드에서 가게를 눌러 일정을 추가해보세요!
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {scheduleCards.map((s) => {
                                        const done = visitedStoreIds.includes(s.id);
                                        return (
                                            <div
                                                key={s.id}
                                                className={`flex items-center gap-3 p-3 bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm ${
                                                    done ? "opacity-90" : ""
                                                }`}
                                            >
                                                <div className="w-20 h-16 overflow-hidden bg-gray-200 rounded-xl">
                                                    <img
                                                        src={s.image || "/images/sample/placeholder.jpg"}
                                                        alt={s.name}
                                                        className="object-cover w-full h-full"
                                                        draggable={false}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {s.district} · {s.category}
                                                    </p>
                                                    <p className="truncate text-[15px] font-semibold text-gray-900">
                                                        {s.name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        운영시간 | {s.hours?.split("(")[0] ?? "정보없음"}
                                                    </p>
                                                </div>

                                                {/* 상태 뱃지/아이콘 */}
                                                {done ? (
                                                    <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                        완료
                                                    </div>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded-full">
                            예정
                          </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>
                </main>
            </div>
        );
    }

    /* ------------------------ 상세 뷰 (리뷰 실제 데이터 표시) ------------------------ */
    const latestReview = activeStore.reviews?.[activeStore.reviews.length - 1];
    const tags = latestReview ? extractTags(latestReview.content) : [];
    const body = latestReview ? stripHash(latestReview.content) : "";

    return (
        <div
            className="mx-auto flex min-h-[100dvh] max-w-[420px] flex-col bg-white"
            style={{
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "calc(env(safe-area-inset-bottom) + 64px)",
            }}
        >
            {/* 헤더 */}
            <header className="sticky top-0 z-10 px-4 py-3 bg-white">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setActiveStoreId(null)}
                        className="px-2 py-1 rounded-lg hover:bg-gray-100"
                    >
                        ←
                    </button>
                    <h1 className="text-base font-semibold truncate">
                        {activeStore.name}
                    </h1>
                    <div className="w-6" />
                </div>
            </header>

            {/* 메인 */}
            <main className="flex flex-1 min-h-0 overflow-y-auto">
                <div className="w-full">
                    {/* 큰 이미지 배너 */}
                    <div className="w-full h-40 bg-gray-200">
                        <img
                            src={activeStore.image || "/images/sample/placeholder-wide.jpg"}
                            alt={activeStore.name}
                            className="object-cover w-full h-full"
                            draggable={false}
                        />
                    </div>

                    {/* 제목/주소/시간 */}
                    <div className="px-4 py-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            {activeStore.name}
                        </h2>
                        <div className="mt-3 text-sm text-gray-600">
                            <p>
                                위치 |{" "}
                                <span className="text-gray-700">{activeStore.address}</span>
                            </p>
                            <p className="mt-1">
                                시간 |{" "}
                                <span className="text-gray-700">{activeStore.hours}</span>
                            </p>
                        </div>
                    </div>
                    <hr className="border-gray-200" />

                    {/* 리뷰 블록 */}
                    <div className="px-4 py-4">
                        {!latestReview ? (
                            <div className="p-6 text-sm text-center text-gray-600 border border-gray-300 border-dashed rounded-2xl">
                                아직 리뷰가 없어요. <br />
                                “방문 인증하고 리뷰 쓰기”로 첫 리뷰를 남겨보세요!
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
                                            <div className="text-xs text-gray-500">
                                                {latestReview.createdAt}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        👍 {latestReview.likes}
                                    </div>
                                </div>

                                {latestReview.images?.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mt-3">
                                        {latestReview.images.slice(0, 3).map((src, i) => (
                                            <div
                                                key={i}
                                                className="h-20 overflow-hidden bg-gray-200 rounded-lg"
                                            >
                                                <img
                                                    src={src}
                                                    alt={`review-${i}`}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <p className="mt-4 text-sm leading-6 text-gray-700 whitespace-pre-wrap">
                                    {body}
                                </p>

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
                    <div className="h-24" />
                </div>
            </main>

            {/* 하단 CTA (탭바 위) */}
            <div
                className="fixed left-1/2 z-[120] -translate-x-1/2 px-5"
                style={{
                    width: "min(420px, 100vw)",
                    bottom: "calc(64px + env(safe-area-inset-bottom) + 12px)",
                }}
            >
                {!isReviewed ? (
                    !isPlanned ? (
                        <button
                            onClick={() => setSheetType("add-mission")}
                            className="w-full py-4 text-white bg-pink-500 shadow-lg rounded-2xl hover:bg-pink-600"
                        >
                            방문 일정에 추가하기
                        </button>
                    ) : (
                        <button
                            onClick={() => setSheetType("write-review")}
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

            {/* 바텀시트 1: 방문 미션 추가 */}
            <BottomSheet open={sheetType === "add-mission"} onClose={closeSheet}>
                <h3 className="text-lg font-bold text-center">
                    7월 방문 미션에 추가할까요?
                </h3>
                <p className="mt-1 text-sm text-center text-gray-600">
                    통합 일정 리스트에서 확인할 수 있어요
                </p>
                <div className="flex justify-center mt-6">
                    <img
                        src="/images/characters/pink.png"
                        alt="캐릭터"
                        className="object-contain w-24 h-24"
                        draggable={false}
                    />
                </div>
                <div className="px-4 mt-8">
                    <button
                        onClick={() => {
                            if (!activeStore) return;

                            // 1) 전역 store 업데이트
                            addPlannedVisit(activeStore.id);

                            // 2) URL 쿼리 정리(있다면 open 제거) + 다음 프레임에 상세 닫기
                            requestAnimationFrame(() => {
                                const p = new URLSearchParams(location.search);
                                if (p.has("open")) {
                                    p.delete("open");
                                    navigate(
                                        { pathname: "/", search: p.toString() },
                                        { replace: true }
                                    );
                                }
                                setActiveStoreId(null); // 상세 닫기
                            });

                            // 3) 시트 닫기
                            closeSheet();
                        }}
                        className="w-full rounded-2xl bg-pink-500 py-4 text-white shadow-lg hover:bg-pink-600 active:scale-[0.99] transition"
                    >
                        완료
                    </button>
                </div>
            </BottomSheet>

            {/* 바텀시트 2: 리뷰 쓰기 유도 → 라우팅 이동 */}
            <BottomSheet open={sheetType === "write-review"} onClose={closeSheet}>
                <h3 className="text-lg font-bold text-center">
                    방문 인증하고 리뷰를 써볼까요?
                </h3>
                <p className="mt-1 text-sm text-center text-gray-600">
                    리뷰를 쓰고 스탬프를 획득하세요
                </p>
                <div className="flex justify-center mt-6">
                    <img
                        src="/images/characters/blue.png"
                        alt="캐릭터"
                        className="object-contain w-24 h-24"
                        draggable={false}
                    />
                </div>
                <div className="px-4 mt-8">
                    <button
                        onClick={() => {
                            if (activeStore) {
                                closeSheet();
                                navigate(`/review/new/${activeStore.id}`);
                            }
                        }}
                        className="w-full rounded-2xl bg-blue-700 py-4 text-white shadow-lg hover:bg-blue-800 active:scale-[0.99] transition"
                    >
                        리뷰 쓰러가기
                    </button>
                </div>
            </BottomSheet>
        </div>
    );
};
