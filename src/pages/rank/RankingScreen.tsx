import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export interface RankingUser {
    id: number;
    nickname: string;
    avatar: string; // 사용 안 하면 ""로 두세요
    badge: string; // 예: '탐험가', '발명가'
    stamps?: number; // 탐험가 점수
    discoveries?: number; // 발명가 점수(첫 발견)
    reviews?: number;
    rank: number;
}

type Movement = "up" | "down" | "same";
type TabKey = "all" | "explorer" | "inventor";

export const RankingScreen: React.FC = () => {
    const { user } = useAppStore();
    const [tab, setTab] = useState<TabKey>("all");

    const monthLabel = `${new Date().getMonth() + 1}월 랭킹`;

    // 데모 데이터 (user가 있으면 4위에 하이라이트)
    const base: (RankingUser & { movement: Movement; isMe?: boolean })[] =
        useMemo(() => {
            const meNick = user?.nickname || "신난 혜림";
            return [
                {
                    id: 1,
                    nickname: "먹전문가 민정",
                    avatar: "",
                    badge: "탐험가",
                    stamps: 12,
                    discoveries: 1,
                    rank: 1,
                    movement: "same",
                },
                {
                    id: 2,
                    nickname: "흥분된타조",
                    avatar: "",
                    badge: "탐험가",
                    stamps: 12,
                    discoveries: 1,
                    rank: 2,
                    movement: "up",
                },
                {
                    id: 3,
                    nickname: "흥분된타조",
                    avatar: "",
                    badge: "탐험가",
                    stamps: 12,
                    discoveries: 1,
                    rank: 3,
                    movement: "down",
                },
                {
                    id: 4,
                    nickname: meNick,
                    avatar: "",
                    badge: "탐험가",
                    stamps: 12,
                    discoveries: 1,
                    rank: 4,
                    movement: "same",
                    isMe: true,
                },
                {
                    id: 5,
                    nickname: "흥분된타조",
                    avatar: "",
                    badge: "탐험가",
                    stamps: 12,
                    discoveries: 1,
                    rank: 5,
                    movement: "up",
                },
                {
                    id: 6,
                    nickname: "흥분된타조",
                    avatar: "",
                    badge: "탐험가",
                    stamps: 12,
                    discoveries: 1,
                    rank: 6,
                    movement: "down",
                },
                {
                    id: 7,
                    nickname: "흥분된타조",
                    avatar: "",
                    badge: "탐험가",
                    stamps: 12,
                    discoveries: 1,
                    rank: 7,
                    movement: "down",
                },
                {
                    id: 8,
                    nickname: "흥분된타조",
                    avatar: "",
                    badge: "탐험가",
                    stamps: 12,
                    discoveries: 1,
                    rank: 8,
                    movement: "down",
                },
                {
                    id: 9,
                    nickname: "흥분된타조",
                    avatar: "",
                    badge: "탐험가",
                    stamps: 12,
                    discoveries: 1,
                    rank: 9,
                    movement: "down",
                },
                {
                    id: 10,
                    nickname: "흥분된타조",
                    avatar: "",
                    badge: "탐험가",
                    stamps: 12,
                    discoveries: 1,
                    rank: 10,
                    movement: "down",
                },
            ];
        }, [user?.nickname]);

    // 탭별 정렬/필터 (데모: 값이 동일하므로 그대로 노출)
    const list = useMemo(() => {
        if (tab === "explorer")
            return [...base].sort((a, b) => (b.stamps || 0) - (a.stamps || 0));
        if (tab === "inventor")
            return [...base].sort(
                (a, b) => (b.discoveries || 0) - (a.discoveries || 0)
            );
        return base;
    }, [tab, base]);

    return (
        <div
            className="mx-auto flex h-full min-h-[100dvh] max-w-[420px] flex-col bg-white"
            style={{
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "calc(env(safe-area-inset-bottom) + 64px)", // BottomNavigation 높이만큼 여백
            }}
        >
            {/* 헤더 (고정) */}
            <header className="sticky top-0 z-10 px-5 pt-6 pb-3 bg-white">
                <h1 className="text-2xl font-bold text-gray-900">{monthLabel}</h1>

                {/* 배너 */}
                <div className="px-4 py-3 mt-4 text-white bg-blue-600 shadow-md rounded-xl">
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
                                className={`-mb-px pb-3 text-sm ${
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
            </header>

            {/* 메인 (스크롤) */}
            <main className="flex flex-1 min-h-0 px-5 py-4 overflow-y-auto">
                <ul className="w-full space-y-3">
                    {list.map((u) => (
                        <li key={u.rank}>
                            <RankingRow user={u} />
                        </li>
                    ))}
                </ul>
            </main>
        </div>
    );
};

/* 랭킹 아이템 */
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
            <div className="flex items-center flex-1 gap-3">
                <Avatar name={user.nickname} src={user.avatar} />
                <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-gray-900">
                        {user.nickname}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                        탐험가 {user.stamps ?? 0}
                        <span className="mx-1"> </span>
                        발명가 {user.discoveries ?? 0}
                    </p>
                </div>
            </div>

            {/* 등락 아이콘 */}
            <div className="ml-3">
                <MovementIcon className="w-5 h-5 text-gray-900" />
            </div>
        </div>
    );
}

/* 간단 아바타 (이미지 없으면 이니셜) */
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
    const initial = name.trim().charAt(0);
    return (
        <div className="grid w-10 h-10 text-sm font-semibold text-gray-600 bg-gray-200 rounded-full place-items-center">
            {initial}
        </div>
    );
}
