import { useAppStore } from "@/store/useAppStore";
import { HomeScreenNoTest } from "@/pages/home/HomeScreenNoTest";
import { HomeScreenWithTest } from "@/pages/home/HomeScreenWithTest";

export const HomeScreen = () => {
  const { user } = useAppStore();
  // 테스트 완료 + 소비타입 산출까지 된 경우에만 완료로 간주
  const hasCompletedTest = Boolean(
    user?.hasCompletedTest && user?.consumerType
  );

  return hasCompletedTest ? <HomeScreenWithTest /> : <HomeScreenNoTest />;
};
