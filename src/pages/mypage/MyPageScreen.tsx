import {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {ChevronRight} from "lucide-react";
import {useAppStore} from "@/store/useAppStore";
import {fetchUserInformation, type UserInformation} from "@/features/auth/api";

export const MyPageScreen: React.FC = () => {
    const navigate = useNavigate();
    const {user, plannedVisitIds, logout, setUser} = useAppStore();

    // 서버에서 불러온 최신 회원정보 (없으면 전역 user로 대체)
    const [info, setInfo] = useState<UserInformation | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // 반복 호출 방지 플래그 (마운트 1회)
    const fetchedRef = useRef(false);

    // 최초 진입 시 1회 회원정보 조회 (무한 루프 방지: deps 비움)
    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        loadInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadInfo = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchUserInformation();
            setInfo(data || null);

            // 전역 user가 이미 있다면 "변경된 값만" 병합 반영(불필요한 렌더 루프 방지)
            if (user) {
                const next = {
                    ...user,
                    name: data.name ?? user.name,
                    nickname: data.nickname ?? user.nickname,
                    consumerType: data.consumerType ?? user.consumerType,
                    stamps: typeof data.stamps === "number" ? data.stamps : user.stamps,
                    reviews: typeof data.reviews === "number" ? data.reviews : user.reviews,
                };
                const changed =
                    next.name !== user.name ||
                    next.nickname !== user.nickname ||
                    next.consumerType !== user.consumerType ||
                    next.stamps !== user.stamps ||
                    next.reviews !== user.reviews;

                if (changed) setUser(next);
            }
        } catch (e: any) {
            setError(e?.message || "회원 정보를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const missionGoal = 10;
    const missionCount = plannedVisitIds.length;
    const progress = Math.min(100, Math.round((missionCount / missionGoal) * 100));

    const nickname = (info?.nickname ?? user?.nickname) || "탐험가님";
    const consumerType = info?.consumerType ?? user?.consumerType;
    const subtitle = useMemo(
        () => (consumerType ? `${consumerType} 타입` : "충청남도의 숨은 맛집을 찾아다니는 탐험가"),
        [consumerType]
    );

    const stamps = typeof info?.stamps === "number" ? info.stamps : (user?.stamps ?? 0);
    const reviews = typeof info?.reviews === "number" ? info.reviews : (user?.reviews ?? 0);

    return (
        // AppShell이 프레임/배경/높이를 관리하므로, 여기선 꽁꽁 채우고 내부만 스크롤
        <div className="w-full h-full flex flex-col overflow-hidden bg-white">
            {/* 헤더 */}
            <header className="px-5 py-4 shadow-sm bg-white">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-extrabold tracking-tight text-gray-900">마이페이지</h1>
                    {loading ? (
                        <span className="text-xs text-gray-400">동기화 중…</span>
                    ) : error ? (
                        <button
                            onClick={loadInfo}
                            className="cursor-pointer text-xs text-red-500 hover:underline"
                        >
                            다시 시도
                        </button>
                    ) : null}
                </div>
            </header>

            {/* 메인: 내부 스크롤 */}
            <main
                className="flex-1 min-h-0 px-5 pb-6 overflow-y-auto"
                style={{
                    paddingTop: "env(safe-area-inset-top)",
                    paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)", // 하단 탭 높이 고려
                }}
            >
                {/* 오류 표시 */}
                {error && (
                    <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                        {error}
                    </div>
                )}

                {/* 프로필 카드 */}
                <section
                    className="mt-4 p-6 shadow-sm rounded-3xl ring-1 ring-black/5 bg-gradient-to-br from-teal-50 via-pink-50 to-blue-50">
                    <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full shadow-md ring-4 ring-white"/>
                    <div className="mt-4 text-center">
                        <div className="text-lg font-extrabold text-gray-900">{nickname}</div>
                        <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
                    </div>

                    {/* 진행도 */}
                    <div className="mt-6">
                        <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-700 to-pink-500"
                                style={{width: `${progress}%`}}
                            />
                        </div>
                        <div className="mt-1 text-xs text-right text-gray-600">
                            {missionCount}/{missionGoal}
                        </div>
                    </div>
                </section>

                {/* 통계 카드 */}
                <section className="grid grid-cols-2 gap-3 mt-5">
                    <div
                        className="flex items-center justify-center gap-3 p-5 bg-white shadow-md rounded-2xl ring-1 ring-black/5">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"/>
                        <div className="text-center">
                            <div className="text-lg font-extrabold text-gray-900">{stamps}개</div>
                            <div className="text-xs text-gray-500">스탬프</div>
                        </div>
                    </div>

                    <div
                        className="flex items-center justify-center gap-3 p-5 bg-white shadow-md rounded-2xl ring-1 ring-black/5">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"/>
                        <div className="text-center">
                            <div className="text-lg font-extrabold text-gray-900">{reviews}개</div>
                            <div className="text-xs text-gray-500">리뷰</div>
                        </div>
                    </div>
                </section>

                {/* 메뉴 리스트 */}
                <section className="mt-5 overflow-hidden bg-white rounded-2xl ring-1 ring-gray-200">
                    <button
                        onClick={() => navigate("/mypage/login")}
                        className="cursor-pointer flex items-center justify-between w-full px-4 py-4 text-left hover:bg-gray-50"
                    >
                        <span className="text-gray-800">로그인 정보</span>
                        <ChevronRight className="w-5 h-5 text-gray-400"/>
                    </button>
                    <hr className="border-gray-200"/>
                    <button
                        onClick={() => navigate("/mypage/reviews")}
                        className="cursor-pointer flex items-center justify-between w-full px-4 py-4 text-left hover:bg-gray-50"
                    >
                        <span className="text-gray-800">나의 리뷰 내역</span>
                        <ChevronRight className="w-5 h-5 text-gray-400"/>
                    </button>
                    <hr className="border-gray-200"/>
                    <button
                        onClick={() => {
                            logout();
                            navigate("/", {replace: true});
                        }}
                        className="cursor-pointer flex items-center justify-between w-full px-4 py-4 text-left hover:bg-gray-50"
                    >
                        <span className="text-gray-800">로그아웃</span>
                        <ChevronRight className="w-5 h-5 text-gray-400"/>
                    </button>
                </section>
            </main>
        </div>
    );
};

export default MyPageScreen;
