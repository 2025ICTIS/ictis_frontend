import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, ArrowDown, Minus, RotateCw } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { fetchRanking, type RankingApiUser } from "@/features/ranking/api";

/* ────────────────────────── types ────────────────────────── */
export interface RankingUser {
  id: number;
  nickname: string;
  avatar?: string;
  badge: string; // '탐험가'
  stamps?: number; // 탐험가 점수(= 리뷰 수)
  discoveries?: number; // 발명가 점수(= 첫 발견 수)
  reviews?: number;
  rank: number;
  isMe?: boolean;
}
type Movement = "up" | "down" | "same";
type TabKey = "all" | "explorer" | "inventor";

/* ──────────────── map server response → UI model ─────────────── */
function mapApiToUsers(list: RankingApiUser[], meNickname?: string | null) {
  // 서버 응답 순서를 그대로 랭킹으로 사용 (1위=첫 요소)
  return list.map<RankingUser & { movement: Movement }>((u, idx) => ({
    id: idx + 1,
    nickname: u.nickname,
    avatar: "",
    badge: "탐험가",
    stamps: u.amountOfReview ?? 0,
    discoveries: u.amountOfFirst ?? 0,
    reviews: u.amountOfReview ?? 0,
    rank: idx + 1,
    isMe: !!meNickname && u.nickname === meNickname,
    movement: "same", // 등락 데이터가 없으므로 동일로 표시
  }));
}

/* ────────────────────────── component ────────────────────────── */
export const RankingScreen: React.FC = () => {
  const me = useAppStore((s) => s.user);
  const [tab, setTab] = useState<TabKey>("all");

  const [list, setList] = useState<(RankingUser & { movement: Movement })[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false); // StrictMode 이중호출 방지

  const monthLabel = `${new Date().getMonth() + 1}월 랭킹`;

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { users } = await fetchRanking(); // 200이면 여기가 resolve
        console.log("Fetched ranking:", users);

        const mapped = mapApiToUsers(users ?? [], me?.nickname ?? null);
        setList(mapped);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "랭킹을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [me?.nickname]);

  // 탭별 정렬/필터
  const filtered = useMemo(() => {
    if (tab === "explorer")
      return [...list].sort((a, b) => (b.stamps || 0) - (a.stamps || 0));
    if (tab === "inventor")
      return [...list].sort(
        (a, b) => (b.discoveries || 0) - (a.discoveries || 0)
      );
    return list;
  }, [tab, list]);

  // AppShell에 맞춘 레이아웃: 전체 높이 채우고 내부 스크롤만
  return (
    <div className="flex h-full w-full flex-col bg-white">
        <header className="px-5 py-4 shadow-sm bg-white">
            <div className="flex items-end justify-between">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">{monthLabel}</h1>
                {!loading && !error && (
                    <span className="text-xs text-gray-500">총 {list.length}명</span>
                )}
            </div>
        </header>
      {/* 상단 */}
      <div className="px-5 pb-3">

        {/* 배너 */}
        <div className="px-4 py-3 mt-3 text-white bg-blue-600 shadow rounded-xl">
          <div className="flex items-center gap-2 text-sm">
            <span role="img" aria-label="medal">
              🏅
            </span>
            <span>숨은 가게 방문하고 이번달의 1등을 노려보세요!</span>
          </div>
        </div>

        {/* 탭 */}
        <nav className="flex items-center gap-6 mt-4 border-b border-gray-200">
          {[
            { key: "all", label: "전체" },
            { key: "explorer", label: "탐험가" },
            { key: "inventor", label: "발명가" },
          ].map((t) => {
            const active = tab === (t.key as TabKey);
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key as TabKey)}
                className={`-mb-px pb-3 text-sm transition-colors ${
                  active
                    ? "border-b-2 border-gray-900 font-semibold text-gray-900"
                    : "border-b-2 border-transparent text-gray-500 hover:text-gray-700"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 본문(스크롤) */}
      <main
        className="flex-1 min-h-0 overflow-y-auto px-5 py-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 64px)" }} // 하단 탭바 높이 보정
      >
        {/* 로딩 스켈레톤 */}
        {loading && (
          <ul className="w-full space-y-3 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="rounded-2xl ring-1 ring-gray-200 p-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded" />
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 w-40 bg-gray-200 rounded" />
                    <div className="h-3 w-24 bg-gray-200 rounded mt-2" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* 에러 */}
        {!loading && error && (
          <div className="w-full text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={async () => {
                try {
                  setError(null);
                  setLoading(true);
                  const { users } = await fetchRanking();
                  setList(mapApiToUsers(users ?? [], me?.nickname ?? null));
                } catch (e: any) {
                  setError(e?.message || "랭킹을 불러오지 못했습니다.");
                } finally {
                  setLoading(false);
                }
              }}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white"
            >
              <RotateCw className="w-4 h-4" />
              다시 시도
            </button>
          </div>
        )}

        {/* 리스트 */}
        {!loading && !error && (
          <ul className="w-full space-y-3">
            {filtered.map((u) => (
              <li key={u.rank}>
                <RankingRow user={u} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

/* ────────────────────────── Row / Avatar ────────────────────────── */
function RankingRow({
  user,
}: {
  user: RankingUser & { movement: Movement; isMe?: boolean };
}) {
  const isTop1 = user.rank === 1;
  const isMe = !!user.isMe;

  const ringClass = isTop1
    ? "ring-2 ring-blue-300 bg-blue-50"
    : isMe
    ? "ring-2 ring-pink-400 bg-gradient-to-r from-pink-50 to-white"
    : "ring-1 ring-gray-200 bg-white";

  const MovementIcon =
    user.movement === "up"
      ? ArrowUp
      : user.movement === "down"
      ? ArrowDown
      : Minus;

  return (
    <div
      className={`flex items-center justify-between rounded-2xl px-4 py-3 ${ringClass}`}
    >
      {/* 순위 */}
      <div className="w-6 mr-3 text-lg font-bold text-gray-900">
        {user.rank}
      </div>

      {/* 아바타 + 텍스트 */}
      <div className="flex items-center flex-1 gap-3 min-w-0">
        <Avatar name={user.nickname} src={user.avatar} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-gray-900">
            {user.nickname}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            탐험가 {user.stamps ?? 0}
            <span className="mx-1" />
            발명가 {user.discoveries ?? 0}
          </p>
        </div>
      </div>

      {/* 등락 아이콘 */}
      <div className="ml-3 shrink-0">
        <MovementIcon className="w-5 h-5 text-gray-900" />
      </div>
    </div>
  );
}

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="object-cover w-10 h-10 rounded-full"
        draggable={false}
      />
    );
  }
  const initial = name.trim().charAt(0) || "?";
  return (
    <div className="grid w-10 h-10 text-sm font-semibold text-gray-600 bg-gray-200 rounded-full place-items-center">
      {initial}
    </div>
  );
}
