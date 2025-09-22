import { useAppStore } from "@/store/useAppStore";

export const HomeScreenWithTest = () => {
    const { user, setCurrentScreen } = useAppStore();

    // 캐릭터 표시
    const getCharacterDisplay = () => (
        <div className="relative flex items-center justify-center w-32 h-32 mx-auto mb-6 bg-blue-500 shadow-lg rounded-3xl">
            <div className="relative">
                <div className="relative w-16 h-16 rotate-45 bg-blue-600 rounded-lg">
                    <div className="absolute inset-0 flex items-center justify-center -rotate-45">
                        <div className="flex flex-col items-center space-y-1">
                            <div className="flex space-x-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            </div>
                            <div className="w-3 h-1 bg-white rounded-full" />
                        </div>
                    </div>
                </div>
                <div className="absolute left-0 w-8 h-2 -translate-x-4 -translate-y-1/2 bg-blue-500 rounded-full top-1/2" />
                <div className="absolute right-0 w-8 h-2 translate-x-4 -translate-y-1/2 bg-blue-500 rounded-full top-1/2" />
                <div className="absolute bottom-0 -translate-x-1/2 translate-y-4 left-1/2">
                    <div className="flex space-x-2">
                        <div className="w-2 h-8 bg-blue-500 rounded-full" />
                        <div className="w-2 h-8 bg-blue-500 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );

    const characteristics = [
        "나의 어떤 달 소비를 돌아보며 소비타입을 알아보세요!",
        "나의 어떤 달 소비를 돌아보며 소비타입을 알아보세요!",
        "나의 어떤 달 소비를 돌아보며 소비타입을 알아보세요!",
        "나의 어떤 달 소비를 돌아보며 소비타입을 알아보세요!",
        "나의 어떤 달 소비를 돌아보며 소비타입을 알아보세요!",
    ];

    return (
        // HomeScreenNoTest와 동일한 프레임(폭/배경/여백)
        <div
            className="mx-auto flex h-full min-h-[100dvh] max-w-[420px] flex-col bg-white"
            style={{
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "calc(env(safe-area-inset-bottom) + 64px)", // BottomNavigation 높이만큼
            }}
        >
            {/* 헤더 (동일 여백, sticky 아님) */}
            <header className="px-5 py-6 bg-white shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">서비스명</h1>
            </header>

            {/* 메인 (동일 여백/스크롤 구조) */}
            <main className="flex flex-1 min-h-0 px-5 py-4 overflow-y-auto">
                <div className="w-full space-y-6">
                    {/* 그라디언트 카드 (NoTest와 동일 스타일) */}
                    <section
                        className="
              flex w-full flex-1 min-h-0 flex-col
              rounded-3xl bg-gradient-to-b from-white to-pink-50
              p-5 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]
            "
                    >
                        {/* 제목/설명 */}
                        <div>
                            <h2 className="mb-1 text-xl font-bold text-gray-900">
                                발빠른 모험가
                            </h2>
                            <p className="mb-5 text-sm text-gray-600">
                                나의 어떤 달 소비를 돌아보며 소비타입을 알아보세요!
                            </p>
                        </div>

                        {/* 캐릭터 */}
                        <div className="mb-6 text-center">{getCharacterDisplay()}</div>

                        {/* 특징 리스트 */}
                        <div className="mb-6 space-y-3">
                            {characteristics.map((item, idx) => (
                                <div key={idx} className="flex items-start">
                                    <span className="flex-shrink-0 w-2 h-2 mt-2 mr-3 bg-blue-500 rounded-full" />
                                    <p className="text-sm leading-relaxed text-gray-700">
                                        {item}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* 버튼들 */}
                        <button
                            onClick={() => setCurrentScreen("explore")}
                            className="w-full py-4 text-lg font-medium text-white transition bg-blue-700 shadow-lg rounded-2xl hover:bg-blue-800 hover:shadow-xl active:scale-95"
                            style={{ minHeight: 52 }}
                        >
                            추천받은 가게 보러가기
                        </button>
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => setCurrentScreen("test")}
                                className="text-sm text-blue-500 transition-colors hover:text-blue-600"
                            >
                                다시 테스트하기
                            </button>
                        </div>
                    </section>

                    {/* 통계 카드 (필요 시 유지) */}
                    <section className="grid grid-cols-3 gap-4">
                        <div className="p-4 text-center bg-white shadow-sm rounded-2xl">
                            <div className="text-2xl font-bold text-blue-600">
                                {user?.stamps || 0}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">획득 스탬프</div>
                        </div>
                        <div className="p-4 text-center bg-white shadow-sm rounded-2xl">
                            <div className="text-2xl font-bold text-green-600">
                                {user?.reviews || 0}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">작성 리뷰</div>
                        </div>
                        <div className="p-4 text-center bg-white shadow-sm rounded-2xl">
                            <div className="text-2xl font-bold text-purple-600">0</div>
                            <div className="mt-1 text-xs text-gray-500">첫 발견</div>
                        </div>
                    </section>

                    {/* 추가 안내 */}
                    <p className="pb-2 text-sm text-center text-gray-500">
                        🚀 당신만의 탐험을 시작해보세요!
                    </p>
                </div>
            </main>
        </div>
    );
};
