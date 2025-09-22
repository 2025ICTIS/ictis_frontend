import { useAppStore } from "@/store/useAppStore.ts";
import { HomeScreenNoTest } from "@/pages/home/HomeScreenNoTest";
import { HomeScreenWithTest } from "@/pages/home/HomeScreenWithTest";

export const HomeScreen = () => {
    const { user } = useAppStore();

    // 사용자가 소비타입 테스트를 완료했는지 확인
    const hasCompletedTest = user?.hasCompletedTest && user?.consumerType;

    return hasCompletedTest ? <HomeScreenWithTest /> : <HomeScreenNoTest />;
};
