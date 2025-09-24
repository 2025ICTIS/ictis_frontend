import { useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { CheckCircle2 } from "lucide-react";
import { InfiniteStoreCarousel } from "@/components/InfiniteStoreCarousel";
import { StoreDetail } from "@/pages/explore/StoreDetail";

export const HomeScreenWithTest = () => {
  // 전역 상태 (표시만)
  const setCurrentScreen = useAppStore((s) => s.setCurrentScreen);
  const stores = useAppStore((s) => s.stores); // 테스트에서 이미 setStores 한 데이터
  const plannedVisitIds = useAppStore((s) => s.plannedVisitIds);
  const visitedStoreIds = useAppStore((s) => s.visitedStoreIds);

  const reviewedStoreIds = useAppStore((s) => s.reviewedStoreIds);
  const addPlannedVisit = useAppStore((s) => s.addPlannedVisit);
  const user = useAppStore((s) => s.user);

  const data = stores; // 별칭

  // 상세 카드 상태
  const [activeStoreId, setActiveStoreId] = useState<number | null>(null);
  const activeStore = useMemo(
    () => data.find((s) => s.id === activeStoreId) || null,
    [data, activeStoreId]
  );

  // 일정 카드 목록 (planned + visited)
  const scheduleCards = useMemo(() => {
    if (!data?.length) return [];
    const ids = Array.from(new Set([...plannedVisitIds, ...visitedStoreIds]));
    return ids
      .map((id) => data.find((s) => s.id === id))
      .filter((s): s is (typeof data)[number] => !!s);
  }, [plannedVisitIds, visitedStoreIds, data]);

  // 진행도
    const missionGoal = 10;
    const completedCount = visitedStoreIds.length;
    const progress = Math.min(
        100,
        Math.round((completedCount / missionGoal) * 100)
    );
    const currentMonth = new Date().getMonth() + 1;

    const handleAddMission = () => {
        if (!activeStore) return;
        addPlannedVisit(activeStore.id);
        setActiveStoreId(null);
    };

    const handleWriteReview = () => {
    if (!activeStore) return;
    // 리뷰 작성 화면이 있다면 navigate(`/review/new/${activeStore.id}`)
    setActiveStoreId(null);
  };

  const hasData = data.length > 0;

  // 리스트는 항상 유지, 상세는 오버레이로 분리
  return (
    <div
        className="w-full h-full flex flex-col overflow-hidden bg-white"
        style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 64px)",
      }}
    >
        {/* 헤더: 지역/돋보기 제거 → “님 맞춤 추천”으로 교체 */}
        <header className="px-5 py-4 shadow-sm bg-white">
            <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
                {user?.nickname ?? "회원"}님 맞춤 추천
            </h1>
            <p className="mt-1 text-sm text-gray-500">
                {user?.district
                    ? `${user.district} 주변의 숨은 가게를 추천해드려요`
                    : "소비 타입 결과를 바탕으로 추천 리스트를 만들었어요"}
            </p>
        </header>


        {/* 메인 */}
        <main className="flex flex-1 min-h-0 px-4 py-4 overflow-hidden">
            <div className="w-full flex flex-col gap-6 min-h-0">
                {/* 상단 캐러셀 / 빈 상태 */}
                <section className="shrink-0">
                    {hasData ? (
                        <InfiniteStoreCarousel
                            items={data}
                            onCardClick={(id) => setActiveStoreId(id)}
                        />
                    ) : (
                        <div className="p-6 text-center border border-gray-300 border-dashed rounded-2xl">
                            <p className="text-sm text-gray-600">
                                표시할 추천 결과가 없어요.
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                소비 타입 테스트를 완료하거나 다시 실행해 주세요.
                            </p>
                            <button
                                onClick={() => setCurrentScreen("test")}
                                className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white"
                            >
                                테스트 하러가기
                            </button>
                        </div>
                    )}
                </section>

                {/* 통합 일정 + 진행도 (추천이 없어도 영역은 유지) */}
                <section className="flex flex-col flex-1 min-h-0">
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {user?.nickname ?? "회원"}님의 {currentMonth}월 방문 일정
                        </h3>
                        <p className="text-sm text-gray-500">
                            미션(방문 목표)과 예정 일정을 통합해서 보여드려요.
                        </p>
                        {/* 진행도 */}
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
                    </div>

                    {/* 일정 리스트 */}
                    {scheduleCards.length === 0 ? (
                        <div className="mt-3 p-6 text-center border border-gray-300 border-dashed rounded-2xl">
                            <p className="text-sm text-gray-600">
                                아직 등록한 방문 일정이 없어요.
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                위의 카드에서 가게를 눌러 일정을 추가해보세요!
                            </p>
                        </div>
                    ) : (
                        <div
                            className="mt-3 flex-1 min-h-0 space-y-3 overflow-y-auto p-1"
                            style={{ WebkitOverflowScrolling: "touch" }}
                        >
                            {scheduleCards.map((s) => {
                                const done = visitedStoreIds.includes(s.id);
                                return (
                                    <div
                                        key={s.id}
                                        className={`flex items-center gap-3 p-3 bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm cursor-pointer transition-all hover:ring-gray-300${
                                            done ? "opacity-90" : ""
                                        }`}
                                        onClick={() => setActiveStoreId(s.id)}
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

        {/* 상세 오버레이 */}
        {activeStore && (
            <StoreDetail
                store={activeStore}
                isPlanned={plannedVisitIds.includes(activeStore.id)}
                isReviewed={reviewedStoreIds.includes(activeStore.id)}
                onClose={() => setActiveStoreId(null)}
                onAddMission={handleAddMission}
                onWriteReview={handleWriteReview}
            />
        )}
    </div>
  );
};
