import {useEffect, useMemo, useRef, useState} from "react";
import {useAppStore} from "@/store/useAppStore";
import {CheckCircle2, ChevronDown, MapPin, Search} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {loadNaverMapsV3} from "@/lib/naverMapLoader";
import {StoreDetail} from "@/pages/explore/StoreDetail";

/* helpers */
function getNaver() {
    const n = (window as any).naver;
    return n && n.maps ? n : null;
}

export const ExploreMapScreen = () => {
    const navigate = useNavigate();

    const stores = useAppStore((s) => s.stores);
    const user = useAppStore((s) => s.user);
    const plannedVisitIds = useAppStore((s) => s.plannedVisitIds);
    const visitedStoreIds = useAppStore((s) => s.visitedStoreIds);
    const reviewedStoreIds = useAppStore((s) => s.reviewedStoreIds);
    const addPlannedVisit = useAppStore((s) => s.addPlannedVisit);

    const isTestDone = Boolean(user?.hasCompletedTest && user?.consumerType);

    const [activeStoreId, setActiveStoreId] = useState<number | null>(null);

    const missionGoal = 10;
    const completedCount = visitedStoreIds.length;
    const progress = Math.min(
        100,
        Math.round((completedCount / missionGoal) * 100)
    );
    const currentMonth = new Date().getMonth() + 1;

    const activeStore = useMemo(
        () => stores.find((s) => s.id === activeStoreId) || null,
        [stores, activeStoreId]
    );

    /* map refs/state */
    const mapEl = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any>(null);
    const markerIndexRef = useRef<Map<number, any>>(new Map());
    const geocodeCacheRef = useRef<Map<number, { lat: number; lng: number }>>(
        new Map()
    );

    const [sdkStatus, setSdkStatus] = useState<
        "idle" | "loading" | "ready" | "failed"
    >("idle");
    const [, setSdkError] = useState<string | null>(null); // suppress unused var

    /* 테스트 미완료인 경우: 화면 전체를 가드로 대체 */
    if (!isTestDone) {
        return (
            <div className="w-full h-full flex flex-col overflow-hidden bg-white">
                <header className="px-5 py-4 shadow-sm bg-white">
                    <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
                        탐색
                    </h1>
                </header>
                <main
                    className="flex-1 min-h-0 px-5 py-6 overflow-y-auto grid place-items-center"
                    style={{
                        paddingTop: "env(safe-area-inset-top)",
                        paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)",
                    }}
                >
                    <section className="max-w-[360px] w-full text-center">
                        <div className="mx-auto mb-5 h-20 w-20 rounded-full bg-indigo-50 grid place-items-center">
                            <Search className="h-10 w-10 text-indigo-500"/>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">
                            탐색은 테스트 완료 후 이용할 수 있어요
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            간단한 테스트로 취향을 파악하고
                            <br/>
                            더 정확한 장소를 추천해 드릴게요.
                        </p>

                        <div className="mt-6 space-y-3">
                            <button
                                onClick={() => navigate("/test")}
                                className="cursor-pointer w-full rounded-2xl bg-indigo-600 px-4 py-3 text-white font-semibold shadow-lg hover:bg-indigo-700 active:scale-[0.99]"
                            >
                                테스트 하러 가기
                            </button>
                            <button
                                onClick={() => navigate("/", {replace: true})}
                                className="cursor-pointer w-full rounded-2xl bg-gray-100 px-4 py-3 text-gray-800 font-medium hover:bg-gray-200 active:scale-[0.99]"
                            >
                                홈으로 돌아가기
                            </button>
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    /* load SDK & init map */
    useEffect(() => {
        const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string;
        if (!clientId) {
            console.error("VITE_NAVER_MAP_CLIENT_ID 누락");
            setSdkStatus("failed");
            setSdkError("VITE_NAVER_MAP_CLIENT_ID 누락");
            return;
        }
        setSdkStatus("loading");
        setSdkError(null);

        let onResize: (() => void) | null = null;

        loadNaverMapsV3(clientId)
            .then(() => {
                if (mapRef.current) {
                    setSdkStatus("ready");
                    return;
                }
                const wn: any = (window as any).naver;
                const n = wn?.maps ? wn : null;
                if (!n?.maps || !mapEl.current) {
                    setSdkStatus("ready");
                    return;
                }
                try {
                    mapRef.current = new n.maps.Map(mapEl.current, {
                        center: new n.maps.LatLng(36.815, 127.113),
                        zoom: 12,
                        zoomControl: false,
                    });
                } catch (e) {
                    console.error("Map 생성 실패:", e);
                    setSdkStatus("failed");
                    setSdkError("Map 생성에 실패했습니다.");
                    return;
                }
                setSdkStatus("ready");
                requestAnimationFrame(() =>
                    n.maps.Event.trigger(mapRef.current, "resize")
                );
                setTimeout(() => n.maps.Event.trigger(mapRef.current!, "resize"), 60);
                onResize = () => n.maps.Event.trigger(mapRef.current!, "resize");
                window.addEventListener("resize", onResize);

                renderMarkers(stores);
            })
            .catch((e) => {
                console.error("Naver Maps load failed:", e);
                setSdkStatus("failed");
                setSdkError(String(e?.message || e));
            });

        return () => {
            if (onResize) window.removeEventListener("resize", onResize);
            markerIndexRef.current.forEach((m) => m.setMap(null));
            markerIndexRef.current.clear();
            geocodeCacheRef.current.clear();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* re-init when needed */
    useEffect(() => {
        const wn: any = (window as any).naver;
        if (!mapEl.current) return;
        if (mapRef.current) return;
        if (sdkStatus !== "ready") return;
        if (!wn?.maps) return;

        try {
            const n = wn;
            mapRef.current = new n.maps.Map(mapEl.current, {
                center: new n.maps.LatLng(36.815, 127.113),
                zoom: 12,
                zoomControl: false,
            });
            requestAnimationFrame(() =>
                n.maps.Event.trigger(mapRef.current, "resize")
            );
            setTimeout(() => n.maps.Event.trigger(mapRef.current!, "resize"), 60);
            renderMarkers(stores);
        } catch (e) {
            console.error("map re-init error:", e);
        }
    }, [sdkStatus, stores]);

    /* rerender markers on stores change */
    useEffect(() => {
        if (!mapRef.current) return;
        renderMarkers(stores);
    }, [stores]);

    /* 상태(예정/방문) 변경 시 마커 색상만 즉시 갱신 */
    useEffect(() => {
        const n = getNaver();
        if (!n || !mapRef.current) return;
        markerIndexRef.current.forEach((marker, id) => {
            const planned = plannedVisitIds.includes(id);
            const visited = visitedStoreIds.includes(id);
            const color = visited ? "#16a34a" : planned ? "#2563eb" : "#ef4444";
            const icon = {
                content: `
            <div style="
              display:inline-flex;align-items:center;justify-content:center;
              width:14px;height:14px;border-radius:50%;
              background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.1);
            "></div>
            `,
                size: new n.maps.Size(14, 14),
                anchor: new n.maps.Point(7, 7),
            };
            try {
                marker.setIcon(icon);
            } catch {
            }
        });
    }, [plannedVisitIds, visitedStoreIds]);

    /* markers */
    const renderMarkers = (list: typeof stores) => {
        const n = getNaver();
        if (!n || !mapRef.current) return;

        const bounds = new n.maps.LatLngBounds();
        const currentIds = new Set(list.map((s) => s.id));

        // remove stale
        markerIndexRef.current.forEach((marker, id) => {
            if (!currentIds.has(id)) {
                marker.setMap(null);
                markerIndexRef.current.delete(id);
            }
        });

        let firstPosForThisRun: any = null;

        const applyView = (lastPos?: any) => {
            const size = markerIndexRef.current.size;
            if (!mapRef.current || size === 0) return;

            if (size === 1) {
                const pos =
                    lastPos ||
                    (() => {
                        const iter = markerIndexRef.current.values();
                        const m = iter.next().value;
                        return m?.getPosition?.();
                    })();
                if (pos) {
                    mapRef.current.setCenter(pos);
                    mapRef.current.setZoom(15);
                }
            } else {
                try {
                    (mapRef.current as any).fitBounds(bounds, {
                        top: 24,
                        right: 24,
                        bottom: 24,
                        left: 24,
                    });
                } catch {
                    mapRef.current.fitBounds(bounds);
                }
            }
            requestAnimationFrame(() =>
                n.maps.Event.trigger(mapRef.current!, "resize")
            );
        };

        list.forEach((s) => {
            const id = s.id;
            const lat = (s as any).latitude ?? geocodeCacheRef.current.get(id)?.lat;
            const lng = (s as any).longitude ?? geocodeCacheRef.current.get(id)?.lng;

            const planned = plannedVisitIds.includes(id);
            const visited = visitedStoreIds.includes(id);
            const color = visited ? "#16a34a" : planned ? "#2563eb" : "#ef4444";
            const icon = {
                content: `
          <div style="
            display:inline-flex;align-items:center;justify-content:center;
            width:14px;height:14px;border-radius:50%;
            background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.1);
          "></div>
        `,
                size: new n.maps.Size(14, 14),
                anchor: new n.maps.Point(7, 7),
            };

            const ensureMarker = (position: any) => {
                const existing = markerIndexRef.current.get(id);
                if (existing) {
                    existing.setIcon(icon);
                    existing.setPosition(position);
                } else {
                    const marker = new n.maps.Marker({
                        position,
                        map: mapRef.current,
                        icon,
                        title: s.name,
                    });
                    n.maps.Event.addListener(marker, "click", () => {
                        setActiveStoreId(id); // ← 상세 열기
                        mapRef.current?.setCenter(position);
                        const z = mapRef.current?.getZoom?.() ?? 12;
                        mapRef.current?.setZoom(Math.max(14, z));
                    });
                    markerIndexRef.current.set(id, marker);
                    if (!firstPosForThisRun) firstPosForThisRun = position;
                }
                bounds.extend(position);
            };

            if (lat != null && lng != null) {
                ensureMarker(new n.maps.LatLng(lat, lng));
                return;
            }

            const svc = n.maps.Service;
            const canGeocode = !!(svc && typeof svc.geocode === "function");
            if (!canGeocode || !s.address) return;

            svc.geocode({query: s.address}, (status: any, resp: any) => {
                if (status !== n.maps.Service.Status.OK) return;
                try {
                    const addr = resp?.v2?.addresses?.[0];
                    if (!addr) return;
                    const y = +addr.y;
                    const x = +addr.x;
                    geocodeCacheRef.current.set(id, {lat: y, lng: x});
                    const pos = new n.maps.LatLng(y, x);
                    ensureMarker(pos);
                    applyView(pos);
                } catch {
                }
            });
        });

        if (markerIndexRef.current.size > 0) {
            applyView(firstPosForThisRun || undefined);
        }
    };

    /* actions for StoreDetail */
    const handleAddMission = () => {
        if (!activeStore) return;
        addPlannedVisit(activeStore.id);
        setActiveStoreId(null);
    };
    const handleWriteReview = () => {
        if (!activeStore) return;
        navigate(`/review/new/${activeStore.id}`);
        setActiveStoreId(null);
    };

    /* schedule cards */
    const ids = Array.from(new Set([...plannedVisitIds, ...visitedStoreIds]));
    const scheduleCards = ids
        .map((id) => stores.find((s) => s.id === id))
        .filter((s): s is (typeof stores)[number] => !!s);

    return (
        <div
            className="w-full h-full flex flex-col overflow-hidden bg-white relative"
            style={{
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "calc(env(safe-area-inset-bottom) + 64px)",
            }}
        >
            {/* 헤더 */}
            <header className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-white">
                <div className="flex items-center justify-between">
                    <button className="cursor-pointer flex items-center gap-1 text-sm text-gray-700">
                        <MapPin className="w-4 h-4"/>
                        <span>{user?.district ?? "지역 선택"}</span>
                        <ChevronDown className="w-4 h-4"/>
                    </button>
                    <button className="cursor-pointer p-2 rounded-full hover:bg-gray-100">
                        <Search className="w-5 h-5 text-gray-700"/>
                    </button>
                </div>
            </header>

            <main className="flex flex-col flex-1 min-h-0 px-4 pb-4 overflow-hidden">
                {/* 지도 */}
                <div
                    ref={mapEl}
                    style={{width: "100%", height: 300}}
                    className="rounded-2xl overflow-hidden border border-gray-100 shrink-0"
                />

                {/* 통합 일정 + 진행도 (추천이 없어도 영역은 유지) */}
                <section className="mt-4 flex flex-col flex-1 min-h-0">
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
                                    style={{width: `${progress}%`}}
                                />
                            </div>
                            <div className="mt-1 text-xs text-right text-gray-500">
                                완료 {completedCount} / 목표 {missionGoal}
                            </div>
                        </div>
                    </div>
                    {/* 일정 리스트 */}
                    {scheduleCards.length === 0 ? (
                        <div className="p-6 text-center border border-gray-300 border-dashed rounded-2xl">
                            <p className="text-sm text-gray-600">
                                아직 등록한 방문 일정이 없어요.
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                지도에서 마커를 눌러 일정을 추가해보세요!
                            </p>
                        </div>
                    ) : (
                        <div className="mt-3 flex-1 min-h-0 space-y-3 overflow-y-auto p-1"
                             style={{WebkitOverflowScrolling: "touch"}}>
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
                                                <CheckCircle2 className="w-5 h-5"/>
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
            </main>


            {/* 상세 오버레이: 여기 하단에 “방문 일정에 추가하기” 버튼이 있습니다 */}
            {activeStore && (
                <StoreDetail
                    key={activeStore.id} // 재마운트 유도 (stale props 방지)
                    store={activeStore}
                    isPlanned={plannedVisitIds.includes(activeStore.id)} // 즉시 계산
                    isReviewed={reviewedStoreIds.includes(activeStore.id)} // 즉시 계산
                    onClose={() => setActiveStoreId(null)}
                    onAddMission={handleAddMission}
                    onWriteReview={handleWriteReview}
                />
            )}
        </div>
    );
};