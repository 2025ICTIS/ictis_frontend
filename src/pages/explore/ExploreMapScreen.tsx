import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { MapPin, ChevronDown, Search, CheckCircle2 } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import { useLocation, useNavigate } from "react-router-dom";
import { loadNaverMaps } from "@/lib/naverMapLoader";

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
  const initializedRef = useRef(false); // StrictMode 이중 실행 방지

  useEffect(() => {
    const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string;
    console.log("[ExploreMapScreen] VITE_NAVER_MAP_CLIENT_ID:", clientId);
    if (!clientId) {
      console.error("VITE_NAVER_MAP_CLIENT_ID 누락");
      return;
    }

    if (initializedRef.current) return;
    initializedRef.current = true;

    let cancelled = false;
    let onResize: (() => void) | null = null;

    loadNaverMaps(clientId)
      .then(() => {
        if (cancelled || !mapEl.current) return;
        const n = getNaver();
        if (!n) return;

        // 컨테이너 사이즈 확인
        const r = mapEl.current.getBoundingClientRect();
        console.log("[ExploreMapScreen] container size:", r.width, r.height);

        mapRef.current = new n.maps.Map(mapEl.current, {
          center: new n.maps.LatLng(36.815, 127.113),
          zoom: 12,
          zoomControl: false,
        });

        // 초기화 직후/표시 직후 리사이즈 트리거
        requestAnimationFrame(() =>
          n.maps.Event.trigger(mapRef.current, "resize")
        );
        setTimeout(() => n.maps.Event.trigger(mapRef.current!, "resize"), 60);

        onResize = () => n.maps.Event.trigger(mapRef.current!, "resize");
        window.addEventListener("resize", onResize);

        renderMarkers(stores);
      })
      .catch((e) => console.error("Naver Maps load failed:", e));

    return () => {
      cancelled = true;
      if (onResize) window.removeEventListener("resize", onResize);
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapRef.current = null;
    };
  }, []);

  // stores 변경 시 마커 갱신
  useEffect(() => {
    if (!mapRef.current) return;
    renderMarkers(stores);
  }, [stores]);

  // 마커 생성/갱신 (지오코딩 안전 가드 추가)
  const renderMarkers = (list: typeof stores) => {
    const n = getNaver();
    if (!n || !mapRef.current) return;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new n.maps.LatLngBounds();
    let count = 0;

    const svc = n.maps.Service;
    const canGeocode = !!(svc && typeof svc.geocode === "function");

    const addMarker = (storeId: number, position: any) => {
      const marker = new n.maps.Marker({ position, map: mapRef.current });
      markersRef.current.push(marker);
      bounds.extend(position);
      count += 1;

      n.maps.Event.addListener(marker, "click", () => {
        setActiveStoreId(storeId);
        mapRef.current?.setCenter(position);
        mapRef.current?.setZoom(Math.max(14, mapRef.current.getZoom()));
      });
    };

    list.forEach((s) => {
      const lat = (s as any).lat;
      const lng = (s as any).lng;

      if (lat != null && lng != null) {
        addMarker(s.id, new n.maps.LatLng(lat, lng));
        return;
      }

      if (!canGeocode || !s.address) {
        // 지오코더 없으면 스킵 (초기 인증/로딩 실패 시 크래시 방지)
        console.warn("Geocoder unavailable. Skip:", s.name, s.address);
        return;
      }

      svc.geocode({ query: s.address }, (status: any, resp: any) => {
        if (status !== n.maps.Service.Status.OK) return;
        try {
          const addr = resp?.v2?.addresses?.[0];
          if (!addr) return;
          const position = new n.maps.LatLng(+addr.y, +addr.x);
          addMarker(s.id, position);
          if (count === 1) {
            // 첫 마커가 생겼다면 지도 범위 맞춤
            mapRef.current?.setCenter(position);
          }
          // 모든 마커가 추가될 때마다 적당히 맞추기
          mapRef.current?.fitBounds(bounds);
        } catch {}
      });
    });

    if (count > 0) {
      mapRef.current.fitBounds(bounds);
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
