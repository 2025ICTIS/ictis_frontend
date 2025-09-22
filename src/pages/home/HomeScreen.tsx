import { useAppStore } from "@/store/useAppStore.ts";
import { HomeScreenNoTest } from "@/pages/home/HomeScreenNoTest";
import {useEffect} from "react";

export const HomeScreen = () => {
    const { user, setCurrentScreen } = useAppStore();

    const hasCompletedTest = !!user?.hasCompletedTest;

    useEffect(() => {
        if (hasCompletedTest) {
            // 테스트 완료 시 홈 대신 탐색 탭으로 전환
            setCurrentScreen("explore");
        }
    }, [hasCompletedTest, setCurrentScreen]);

    // 테스트 완료 전에는 기존 노테스트 홈 표시
    return <HomeScreenNoTest />;
};
