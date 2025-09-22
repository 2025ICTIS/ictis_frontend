import { useAppStore } from "@/store/useAppStore";
import BottomNavigation from "@/components/BottomNavigation.tsx";
import { LoadingScreen } from "@/components/Loading.tsx";
import { SignupScreen } from "@/pages/auth/SignupScreen.tsx";
import {AppShell} from "@/components/AppShell.tsx";

export default function App() {
    const screen = useAppStore((s) => s.currentScreen);
    const hideBottomNav = screen === "loading" || screen === "signup";

    return (
        <AppShell>
            {/* currentScreen으로 화면 전환 */}
            {screen === "loading" && <LoadingScreen />}
            {screen === "signup" && <SignupScreen />}

            {/* 필요 시 다른 화면도 추가:
                {screen === "home" && <HomeScreen />} 등 */}
            {!hideBottomNav && <BottomNavigation />}
        </AppShell>
    );
}