import { useAppStore } from "@/store/useAppStore";
import { BottomNavigation } from "@/components/BottomNavigation.tsx";
import { LoadingScreen } from "@/components/Loading.tsx";
import { SignupScreen } from "@/pages/auth/SignupScreen.tsx";
import { LoginScreen } from "@/pages/auth/LoginScreen.tsx";
import { HomeScreen } from "@/pages/home/HomeScreen.tsx";

import {AppShell} from "@/components/AppShell.tsx";
import {ConsumerTypeTest} from "@/consumer/ConsumerTypeTest.tsx";
import {ExploreScreen} from "@/pages/explore/ExploreScreen.tsx";

export default function App() {
    const screen = useAppStore((s) => s.currentScreen);
    const hideBottomNav = screen === "loading" || screen === "signup";

    return (
        <AppShell>
            {/* currentScreen으로 화면 전환 */}
            {screen === "loading" && <LoadingScreen />}
            {screen === "signup" && <SignupScreen />}
            {screen === "login" && <LoginScreen />}
            {screen === "home" && <HomeScreen />}
            {screen === "test" && <ConsumerTypeTest />}
            {screen === "explore" && <ExploreScreen />}
            {/* 필요 시 다른 화면도 추가: {screen === "home" && <HomeScreen />} 등 */}
            {!hideBottomNav && <BottomNavigation />}
        </AppShell>
    );
}