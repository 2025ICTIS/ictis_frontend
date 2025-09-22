import { Home, Search, Trophy, User } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

type ScreenType =
    | "loading"
    | "signup"
    | "login"
    | "home"
    | "test"
    | "explore"
    | "ranking"
    | "mypage";

interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    screen: ScreenType;
}

export const BottomNavigation = () => {
    const { currentScreen, setCurrentScreen } = useAppStore();

    const navItems: NavItem[] = [
        { id: "home", label: "홈", icon: Home, screen: "home" },
        { id: "explore", label: "탐색", icon: Search, screen: "explore" },
        { id: "ranking", label: "랭킹", icon: Trophy, screen: "ranking" },
        { id: "mypage", label: "마이", icon: User, screen: "mypage" },
    ];

    // 네비게이션이 표시되지 않아야 하는 화면들
    const hiddenScreens: ScreenType[] = ["loading", "signup", "login", "test"];

    if (hiddenScreens.includes(currentScreen)) {
        return null;
    }

    // AppShell 내부(relative 컨테이너)에 붙도록 absolute 사용
    return (
        <div className="absolute bottom-0 left-0 right-0 z-40 w-full bg-white border-t border-gray-200">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentScreen === item.screen;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setCurrentScreen(item.screen)}
                            className={`cursor-pointer flex flex-col items-center justify-center py-2 px-2 min-w-0 flex-1 transition-all duration-200 rounded-lg active:scale-95 ${
                                isActive ? "transform scale-105" : ""
                            }`}
                            style={{ minHeight: "60px" }}
                        >
                            <div className="p-1.5 rounded-lg transition-colors">
                                <Icon
                                    className={`w-6 h-6 transition-colors ${
                                        isActive ? "text-blue-500" : "text-gray-400"
                                    }`}
                                />
                            </div>
                            <span
                                className={`text-xs font-medium mt-1 transition-colors ${
                                    isActive ? "text-blue-500" : "text-gray-400"
                                }`}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};