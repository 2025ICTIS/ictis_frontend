import { useAppStore } from "@/store/useAppStore.ts";

export const HomeScreenNoTest = () => {
  const { setCurrentScreen } = useAppStore();

  return (
    // AppShell이 프레임/높이를 관리하므로, 여기선 꽉 채우고 스크롤을 완전히 차단
    <div className="w-full h-full flex flex-col overflow-hidden bg-white">
      {/* 헤더 (sticky 제거, 고정 높이) */}
      <header className="px-5 py-4 shadow-sm bg-white">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            맞춤 추천 받기
          </h1>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
            1분 소요
          </span>
        </div>
      </header>

      {/* 메인 */}
      <main className="flex flex-1 min-h-0 px-5 py-5 overflow-y-auto">
        <div className="w-full space-y-6">
          {/* 히어로 카드 */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-xl" />
            <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/10 blur-xl" />
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              내 정보로 딱 맞는 가게 추천
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/90">
              성별/연령/주소만 입력하면 장소를 추천해줘요.
            </p>

            {/* 예시 입력 칩 */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-2 py-1 text-xs font-medium text-white backdrop-blur">
                gender: 남자
              </span>
              <span className="rounded-full bg-white/20 px-2 py-1 text-xs font-medium text-white backdrop-blur">
                age: 20대
              </span>
              <span className="rounded-full bg-white/20 px-2 py-1 text-xs font-medium text-white backdrop-blur">
                address: 대전광역시 중구
              </span>
            </div>

            {/* CTA */}
            <button
              onClick={() => setCurrentScreen("test")}
              className="mt-5 w-full cursor-pointer rounded-2xl bg-white/95 px-4 py-4 text-center text-base font-semibold text-indigo-700 shadow-lg transition hover:bg-white"
            >
              테스트하고 추천 가게 받기
            </button>
          </section>

          {/* 안내 섹션 */}
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-gray-900">
              이렇게 추천해 드려요
            </h3>

            {/* 결과 미리보기(스켈레톤 카드) */}
            <div className="mt-5 space-y-3">
              {[
                {
                  name: "펠리체카페",
                  address: "대전 중구 대종로 363",
                  hours: "매일 10:00 - 21:00",
                },
                {
                  name: "브릭식스",
                  address: "대전 중구 대종로 430-2",
                  hours: "월-금 11:30 - 22:00",
                },
                {
                  name: "카이모카",
                  address: "대전 중구 보문로 9-12",
                  hours: "매일 09:00 - 22:00",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-4 shadow-[0_8px_20px_rgba(0,0,0,0.05)]"
                >
                  <div className="mt-0.5 h-10 w-10 flex-shrink-0 rounded-xl bg-indigo-100 text-indigo-600 grid place-items-center font-bold">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-900">
                      {s.name}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      {s.address}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">{s.hours}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 하단 안내 */}
          <p className="pb-2 text-center text-xs text-gray-400">
            입력하신 정보는 추천 결과 제공 목적에만 사용돼요.
          </p>
        </div>
      </main>
    </div>
  );
};
