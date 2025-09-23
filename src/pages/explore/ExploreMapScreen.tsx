import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { MapPin, ChevronDown, Search, CheckCircle2 } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import { useLocation, useNavigate } from "react-router-dom";
import { loadNaverMapsV3 } from "@/lib/naverMapLoader";


const extractTags = (txt: string) => (txt.match(/#[^\s#]+/g) || []).slice(0, 6);
const stripHash = (txt: string) => txt.replace(/#[^\s#]+/g, "").trim();

// naver 객체 안전 획득 헬퍼
function getNaver() {
    const n = (window as any).naver;
    return n && n.maps ? n : null;
}

export const ExploreMapScreen = () => {
    console.log("[ExploreMapScreen] render");
    const navigate = useNavigate();
    const location = useLocation();

    const stores = useAppStore((s) => s.stores);
    const user = useAppStore((s) => s.user);
    const plannedVisitIds = useAppStore((s) => s.plannedVisitIds);
    const visitedStoreIds = useAppStore((s) => s.visitedStoreIds);
    const reviewedStoreIds = useAppStore((s) => s.reviewedStoreIds);
    const addPlannedVisit = useAppStore((s) => s.addPlannedVisit);

    const [sheetType, setSheetType] = useState<
        "add-mission" | "write-review" | null
    >(null);
    const closeSheet = () => setSheetType(null);
    const [activeStoreId, setActiveStoreId] = useState<number | null>(null);

    const missionGoal = 10;
    const completedCount = visitedStoreIds.length;
    const progress = Math.min(
        100,
        Math.round((completedCount / missionGoal) * 100)
    );

    const activeStore = useMemo(
        () => stores.find((s) => s.id === activeStoreId) || null,
        [stores, activeStoreId]
    );

    const isPlanned = activeStore
        ? plannedVisitIds.includes(activeStore.id)
        : false;
    const isReviewed = activeStore
        ? reviewedStoreIds.includes(activeStore.id)
        : false;

    // ── 지도 세팅 ─────────────────────────────────────────────
    const mapEl = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const [sdkStatus, setSdkStatus] = useState<"idle" | "loading" | "ready" | "failed">("idle");
    const [sdkError, setSdkError] = useState<string | null>(null);
    const markerIndexRef = useRef<Map<number, any>>(new Map());
    const geocodeCacheRef = useRef<Map<number, { lat: number; lng: number }>>(new Map());


    useEffect(() => {
        const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string;
        console.log("[ExploreMapScreen] mount, VITE_NAVER_MAP_CLIENT_ID:", clientId);

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
                console.log("[ExploreMapScreen] loader.then entered");

                // 이미 초기화된 경우(StrictMode 2회 실행 케이스) 중복 생성 방지
                if (mapRef.current) {
                    console.log("[ExploreMapScreen] map already initialized. skip re-init.");
                    setSdkStatus("ready");
                    return;
                }

                const wn: any = (window as any).naver;
                console.log("[ExploreMapScreen] window.naver?.maps exists?", !!wn?.maps);

                if (!mapEl.current) {
                    console.warn("[ExploreMapScreen] mapEl is null on first init. Will init later when it mounts.");
                    setSdkStatus("ready"); // SDK는 로드 완료
                    return;
                }

                const n = wn?.maps ? wn : null;
                if (!n?.maps) {
                    setSdkStatus("failed");
                    setSdkError("SDK가 준비되지 않았습니다. 도메인 허용/키/네트워크를 확인하세요.");
                    return;
                }

                const r = mapEl.current.getBoundingClientRect();
                console.log("[ExploreMapScreen] container size:", r.width, r.height);

                try {
                    mapRef.current = new n.maps.Map(mapEl.current, {
                        center: new n.maps.LatLng(36.815, 127.113),
                        zoom: 12,
                        zoomControl: false,
                    });
                } catch (e) {
                    console.error("[ExploreMapScreen] Map constructor error:", e);
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
            markersRef.current.forEach((m) => m.setMap(null));
            markersRef.current = [];
            markerIndexRef.current.forEach((m) => m.setMap(null));
            markerIndexRef.current.clear();
            geocodeCacheRef.current.clear();
            mapRef.current = null;
        };
    }, []);

    // 상세 보기로 들어갈 때(지도 컨테이너가 DOM에서 사라짐) → mapRef/마커 정리
    useEffect(() => {
        if (activeStoreId != null) {
            // 상세 진입 시 지도 인스턴스/마커를 정리해 다음에 재초기화되게 함
            markersRef.current.forEach((m) => m.setMap(null));
            markersRef.current = [];
            markerIndexRef.current.forEach((m) => m.setMap(null));
            markerIndexRef.current.clear();
            mapRef.current = null;
        }
    }, [activeStoreId]);

    // 리스트로 돌아와 지도 컨테이너가 다시 DOM에 나타났다면 재초기화
    useEffect(() => {
        const wn: any = (window as any).naver;
        if (!mapEl.current) return;              // 컨테이너가 아직 없음
        if (mapRef.current) return;              // 이미 초기화됨
        if (sdkStatus !== "ready") return;       // SDK가 아직 준비 안 됨
        if (!wn?.maps) return;                   // 안전 가드

        try {
            const n = wn;
            const r = mapEl.current.getBoundingClientRect();
            console.log("[ExploreMapScreen] re-init map, container size:", r.width, r.height);

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
            console.error("[ExploreMapScreen] re-init error:", e);
        }
    }, [activeStoreId, sdkStatus, stores]);

    // stores 변경 시 마커 갱신
    useEffect(() => {
        if (!mapRef.current) return;
        renderMarkers(stores);
    }, [stores]);

    // 마커 생성/갱신 (중복 방지/지오코딩 캐시/상태별 아이콘)
    const renderMarkers = (list: typeof stores) => {
        const n = getNaver();
        if (!n || !mapRef.current) return;

        const bounds = new n.maps.LatLngBounds();

        // 현재 스토어 ID 집합
        const currentIds = new Set(list.map((s) => s.id));

        // 1) 빠진 마커 제거
        markerIndexRef.current.forEach((marker, id) => {
            if (!currentIds.has(id)) {
                marker.setMap(null);
                markerIndexRef.current.delete(id);
            }
        });

        // 2) 추가/업데이트
        let addedThisRun = 0;
        let firstPosForThisRun: any = null;

        const applyView = (lastPos?: any) => {
            const size = markerIndexRef.current.size;
            if (!mapRef.current || size === 0) return;

            if (size === 1) {
                const pos =
                    lastPos ||
                    (() => {
                        // 유일 마커의 위치를 가져옵니다.
                        const iter = markerIndexRef.current.values();
                        const m = iter.next().value;
                        return m?.getPosition?.();
                    })();
                if (pos) {
                    mapRef.current.setCenter(pos);
                    mapRef.current.setZoom(15); // 단일 마커는 적절한 확대 레벨로
                }
            } else {
                // 여러 개 → 패딩을 줘서 보기 좋게 맞춤
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

            // 리사이즈 트리거로 오버레이 재배치 안정화
            requestAnimationFrame(() =>
                n.maps.Event.trigger(mapRef.current!, "resize")
            );
        };

        list.forEach((s) => {
            const id = s.id;

            // 좌표 확보(우선: s.latitude/longitude → 캐시 → 지오코딩)
            const lat =
                (s as any).latitude ??
                geocodeCacheRef.current.get(id)?.lat;
            const lng =
                (s as any).longitude ??
                geocodeCacheRef.current.get(id)?.lng;

            const planned = plannedVisitIds.includes(id);
            const visited = visitedStoreIds.includes(id);

            // 상태별 간단 아이콘(색상)
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
                        setActiveStoreId(id);
                        mapRef.current?.setCenter(position);
                        const z = mapRef.current?.getZoom?.() ?? 12;
                        mapRef.current?.setZoom(Math.max(14, z));
                    });
                    markerIndexRef.current.set(id, marker);
                    addedThisRun += 1;
                    if (!firstPosForThisRun) firstPosForThisRun = position;
                }
                bounds.extend(position);
            };

            if (lat != null && lng != null) {
                const pos = new n.maps.LatLng(lat, lng);
                ensureMarker(pos);
                return;
            }

            // 주소 지오코딩(있을 때만)
            const svc = n.maps.Service;
            const canGeocode = !!(svc && typeof svc.geocode === "function");
            if (!canGeocode || !s.address) {
                return;
            }

            svc.geocode({ query: s.address }, (status: any, resp: any) => {
                if (status !== n.maps.Service.Status.OK) return;
                try {
                    const addr = resp?.v2?.addresses?.[0];
                    if (!addr) return;
                    const y = +addr.y;
                    const x = +addr.x;
                    geocodeCacheRef.current.set(id, { lat: y, lng: x });
                    const pos = new n.maps.LatLng(y, x);
                    ensureMarker(pos);

                    // 비동기 추가 시에도 즉시 화면 맞춤
                    applyView(pos);
                } catch {}
            });
        });

        // 동기(좌표 보유) 케이스 화면 맞춤
        if (markerIndexRef.current.size > 0) {
            applyView(firstPosForThisRun || undefined);
        }
    };

    // ── UI (리스트/상세) ──────────────────────────────────────
    if (!activeStore) {
        const ids = Array.from(new Set([...plannedVisitIds, ...visitedStoreIds]));
        const scheduleCards = ids
            .map((id) => stores.find((s) => s.id === id))
            .filter((s): s is (typeof stores)[number] => !!s);

        return (
            <div
                className="mx-auto flex min-h-[100dvh] max-w-[420px] flex-col bg-white"
                style={{
                    paddingTop: "env(safe-area-inset-top)",
                    paddingBottom: "calc(env(safe-area-inset-bottom) + 64px)",
                }}
            >
                <header className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-white">
                    <div className="flex items-center justify-between">
                        <button className="flex items-center gap-1 text-sm text-gray-700">
                            <MapPin className="w-4 h-4" />
                            <span>{user?.district ?? "지역 선택"}</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-full hover:bg-gray-100">
                            <Search className="w-5 h-5 text-gray-700" />
                        </button>
                    </div>
                </header>

                <div className="mx-4">
                    <div
                        ref={mapEl}
                        style={{ width: "100%", height: 360 }}
                        className="rounded-2xl overflow-hidden border border-gray-100"
                    />
                </div>

                <main className="flex-1 min-h-0 px-4 pb-4 overflow-y-auto">
                    <section className="space-y-3 mt-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {user?.nickname ?? "회원"}님의 7월 방문 일정
                        </h3>
                        <p className="text-sm text-gray-500">
                            미션(방문 목표)과 예정 일정을 통합해서 보여드려요. 완료된 곳은
                            체크로 표시돼요.
                        </p>

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
                </main>
            </div>
        );
    }

    // 상세 뷰
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

            <main className="flex flex-1 min-h-0 overflow-y-auto">
                <div className="w-full">
                    <div className="w-full h-40 bg-gray-200">
                        <img
                            src={activeStore.image || "/images/sample/placeholder-wide.jpg"}
                            alt={activeStore.name}
                            className="object-cover w-full h-full"
                            draggable={false}
                        />
                    </div>

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

                    <div className="px-4 py-4">
                        {!latestReview ? (
                            <div className="p-6 text-sm text-center text-gray-600 border border-gray-300 border-dashed rounded-2xl">
                                아직 리뷰가 없어요. <br /> “방문 인증하고 리뷰 쓰기”로 첫 리뷰를
                                남겨보세요!
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

            <BottomSheet open={sheetType === "add-mission"} onClose={closeSheet}>
                <h3 className="text-lg font-bold text-center">
                    방문 미션에 추가할까요?
                </h3>
                <p className="mt-1 text-sm text-center text-gray-600">
                    통합 일정 리스트에서 확인할 수 있어요
                </p>
                <div className="px-4 mt-8">
                    <button
                        onClick={() => {
                            if (!activeStore) return;
                            addPlannedVisit(activeStore.id);
                            requestAnimationFrame(() => {
                                const p = new URLSearchParams(location.search);
                                if (p.has("open")) {
                                    p.delete("open");
                                    navigate(
                                        { pathname: "/", search: p.toString() },
                                        { replace: true }
                                    );
                                }
                            });
                            closeSheet();
                            setTimeout(() => setActiveStoreId(null), 0);
                        }}
                        className="w-full rounded-2xl bg-pink-500 py-4 text-white shadow-lg hover:bg-pink-600 active:scale-[0.99] transition"
                    >
                        완료
                    </button>
                </div>
            </BottomSheet>

            <BottomSheet open={sheetType === "write-review"} onClose={closeSheet}>
                <h3 className="text-lg font-bold text-center">
                    방문 인증하고 리뷰를 써볼까요?
                </h3>
                <p className="mt-1 text-sm text-center text-gray-600">
                    리뷰를 쓰고 스탬프를 획득하세요
                </p>
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