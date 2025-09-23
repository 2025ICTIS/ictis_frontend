import { useState } from "react";
import { ChevronLeft, Award } from "lucide-react";
import { useAppStore } from "@/store/useAppStore.ts";
import { AGE_MAP, GENDER_MAP, TEST_QUESTIONS } from "@/constants";
import { getRecommendations } from "@/features/recommend/api.ts";

/* API → 전역 store 형태로 변환 (Store 인터페이스에 맞춤) */
const toStoreItems = (items: any[]) =>
    items.map((it: any, idx: number) => ({
        id: 10000 + idx,
        name: it.name,
        category: "추천",
        district: it.address?.split(/\s+/).slice(0, 2).join(" ") || "지역미상",
        address: it.address,
        hours: it.hours ?? "정보없음",
        image: undefined,
        reviews: [],
        visitCount: 0,
        // 좌표 매핑: latitude / longtitude(경도 오탈자) → Store.latitude/longitude
        latitude: typeof it.latitude === "number" ? it.latitude : undefined,
        longitude: typeof it.longtitude === "number" ? it.longtitude : undefined,
    }));

export const ConsumerTypeTest: React.FC = () => {
  const {
    currentQuestionIndex,
    setCurrentQuestionIndex,
    setCurrentScreen,
    completeTest,
    user,
    setUserDemographics,
    setStores, // 전역 stores 갱신
  } = useAppStore();

  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);

  const [gender, setGender] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [district, setDistrict] = useState("");

  const currentQuestion = TEST_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / TEST_QUESTIONS.length) * 100;
  const isDistrict = currentQuestion.kind === "district";

  const goBack = () => {
    if (currentQuestionIndex > 0)
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    else setCurrentScreen("home");
  };

  const handleNext = async () => {
    if (!selectedAnswer) return;

    let nextGender = gender;
    let nextAgeRange = ageRange;
    let nextDistrict = district;

    if (currentQuestion.kind === "gender") {
      nextGender = selectedAnswer;
      setGender(selectedAnswer);
    }
    if (currentQuestion.kind === "age") {
      nextAgeRange = selectedAnswer;
      setAgeRange(selectedAnswer);
    }
    if (currentQuestion.kind === "district") {
      nextDistrict = selectedAnswer;
      setDistrict(selectedAnswer);
    }

    // 다음 질문으로 이동
    if (currentQuestionIndex < TEST_QUESTIONS.length - 1) {
      setSelectedAnswer("");
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      return;
    }

    // 마지막 질문 → 로딩 표시 + 추천 조회 + 전역 저장 + 이동
    setShowResult(true);

    const payload = {
      gender: GENDER_MAP[nextGender] ?? nextGender,
      age: AGE_MAP[nextAgeRange] ?? nextAgeRange,
      address: nextDistrict,
    };

    try {
      // 유저 인구통계 저장 (로그인 전이면 무시될 수 있음 → 게스트 생성이 필요하면 store 로직 보완)
      setUserDemographics({
        gender: payload.gender,
        ageRange: payload.age,
        district: payload.address,
      });

      // 추천 API 1회 호출 (axios/직접 data 모두 대응)
      const raw = await getRecommendations(payload);
      const list = Array.isArray((raw as any)?.data) ? (raw as any).data : raw;

      // 결과를 전역 stores로 저장 → 홈에서 즉시 렌더
      setStores(toStoreItems(list));

      // 테스트 완료 플래그
      completeTest("추천완료");

      // 홈으로 이동 (HomeScreenWithTest에서 재조회하지 않도록 가드 권장)
      setCurrentScreen("home");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "추천 요청 중 오류가 발생했습니다.");
      setShowResult(false); // 오류 시 로딩 닫기
    } finally {
      setCurrentQuestionIndex(0);
      setSelectedAnswer("");
    }
  };

  // 로딩 화면
  if (showResult) {
    return (
      <div className="w-full h-full flex flex-col bg-gradient-to-br from-pink-50 to-white overflow-hidden">
        <header className="px-4 py-4 bg-transparent">
          <button
            onClick={goBack}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
        </header>
        <div className="grid flex-1 min-h-0 p-4 overflow-hidden place-items-center">
          <div className="w-full max-w-md p-8">
            <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-pink-100 rounded-full">
              <Award className="w-12 h-12 text-pink-500" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-center text-gray-900">
              {user?.nickname}님의 맞춤 추천 준비 중...
            </h2>
            <p className="mb-8 text-center text-gray-600">
              잠시만 기다려주세요
            </p>
            <div className="flex justify-center mb-8">
              <div className="w-8 h-8 border-2 border-pink-300 rounded-full animate-spin border-b-pink-500" />
            </div>
            <div className="space-y-2 text-sm text-center text-gray-500">
              <p className="animate-pulse">
                입력 정보를 바탕으로 추천 생성 중...
              </p>
              <p className="animate-pulse" style={{ animationDelay: "0.5s" }}>
                장소 후보 선별 중...
              </p>
              <p className="animate-pulse" style={{ animationDelay: "1s" }}>
                최적의 목록 정렬 중...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    // 페이지는 스크롤 금지, “선택지 컨테이너”만 스크롤
    <div className="w-full h-full relative flex flex-col overflow-hidden bg-white">
      {/* 헤더 */}
      <header className="flex items-center gap-2 px-4 py-4 bg-white shadow-sm">
        <button
          onClick={goBack}
          className="p-2 transition-colors rounded-lg hover:bg-gray-100 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-600">
            {currentQuestionIndex + 1} / {TEST_QUESTIONS.length}
          </div>
        </div>
      </header>

      {/* 진행률 바 */}
      <div className="px-4 pb-4 bg-white shadow-sm">
        <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full">
          <div
            className="h-2 transition-all duration-500 ease-out bg-blue-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 본문 */}
      <main className="flex-1 min-h-0 p-4 overflow-hidden">
        <section className="flex flex-col flex-1 min-h-0 p-4 bg-white shadow-sm rounded-2xl overflow-hidden">
          {/* 질문 제목 */}
          <h2 className="mb-4 text-xl font-bold leading-relaxed text-gray-900">
            {currentQuestion.title}
          </h2>

          {/* 선택지 컨테이너 */}
          <div
            className={`flex-1 min-h-0 pr-2 pb-28 overscroll-contain overflow-y-auto ${
              isDistrict ? "max-h-[60vh]" : ""
            }`}
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {currentQuestion.options.map((option) => (
              <AnswerOption
                key={option.id}
                optionId={option.id}
                text={option.text}
                selected={selectedAnswer === option.id}
                onSelect={() => setSelectedAnswer(option.id)}
              />
            ))}
          </div>
        </section>
      </main>

      {/* 하단 고정 CTA */}
      <div
        className="absolute left-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 px-4"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      >
        <button
          onClick={handleNext}
          disabled={!selectedAnswer}
          className={`w-full rounded-xl py-4 text-lg font-medium transition-all duration-200 shadow-lg ${
            selectedAnswer
              ? "bg-blue-500 text-white hover:scale-[1.01] hover:bg-blue-600 hover:shadow-xl cursor-pointer "
              : "cursor-not-allowed bg-gray-200 text-gray-400"
          }`}
        >
          {currentQuestionIndex === TEST_QUESTIONS.length - 1 ? "완료" : "다음"}
        </button>
      </div>
    </div>
  );
};

/* 선택지 버튼 */
function AnswerOption({
  text,
  selected,
  onSelect,
}: {
  optionId: string; // 상위에서 전달됨
  text: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-xl border-2 p-4 text-left transition-all duration-200 cursor-pointer ${
        selected
          ? "border-pink-300 bg-pink-50 text-pink-800 shadow-lg"
          : "border-transparent bg-gray-50 text-gray-700 hover:border-gray-200 hover:bg-gray-100 hover:shadow-md"
      }`}
    >
      <div className="flex items-center">
        <span
          className={`mr-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
            selected
              ? "border-pink-500 bg-pink-500"
              : "border-gray-300 bg-white"
          }`}
        >
          {selected && <span className="w-2 h-2 bg-white rounded-full" />}
        </span>
        <span className="font-medium">{text}</span>
      </div>
    </button>
  );
}
