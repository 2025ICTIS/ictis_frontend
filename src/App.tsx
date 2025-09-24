import {useEffect, useMemo} from "react";
import {Outlet, Route, Routes, useLocation, useNavigate} from "react-router-dom";
import {useAppStore} from "@/store/useAppStore";
import {BottomNavigation} from "@/components/BottomNavigation.tsx";
import {LoadingScreen} from "@/components/Loading.tsx";
import {SignupScreen} from "@/pages/auth/SignupScreen.tsx";
import {LoginScreen} from "@/pages/auth/LoginScreen.tsx";
import {HomeScreen} from "@/pages/home/HomeScreen.tsx";
import {ConsumerTypeTest} from "@/pages/consumer/ConsumerTypeTest.tsx";
import {ExploreMapScreen} from "@/pages/explore/ExploreMapScreen";
import {RankingScreen} from "@/pages/rank/RankingScreen.tsx";
import MyPageScreen from "@/pages/mypage/MyPageScreen.tsx";
import {AppShell} from "@/components/AppShell.tsx";
import LoginInfoScreen from "@/pages/mypage/LoginInfoScreen.tsx";
import MyReviewsScreen from "@/pages/mypage/MyReviewsScreen.tsx";
import ReviewWritePage from "@/pages/explore/ReviewWriteScreen.tsx";

// screen <-> path 매핑
const screenToPath = {
    loading: "/loading",
    signup: "/signup",
    login: "/login",
    home: "/",
    test: "/test",
    explore: "/explore",
    ranking: "/ranking",
    mypage: "/mypage",
} as const;

const pathToScreen: Record<string, keyof typeof screenToPath> = Object.entries(screenToPath)
    .reduce((acc, [screen, path]) => {
        acc[path] = screen as keyof typeof screenToPath;
        return acc;
    }, {} as Record<string, keyof typeof screenToPath>);

// 라우트별로 BottomNavigation 숨김 여부
const hiddenBottomNavPaths = new Set<string>([
    "/loading",
    "/signup",
    "/login",
    "/test",
]);

function AppLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const screen = useAppStore((s) => s.currentScreen);
    const setCurrentScreen = useAppStore((s) => s.setCurrentScreen);

    // URL -> screen 동기화
    useEffect(() => {
        const currentPath = location.pathname || "/";
        const mapped = pathToScreen[currentPath];
        if (mapped && mapped !== screen) {
            setCurrentScreen(mapped);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    // screen -> URL 동기화
    useEffect(() => {
        const targetPath = screenToPath[screen] ?? "/";
        if (location.pathname !== targetPath) {
            navigate(targetPath, {replace: true});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen]);

    const hideBottomNav = useMemo(() => hiddenBottomNavPaths.has(location.pathname), [location.pathname]);

    return (
        <AppShell>
            <Outlet/>
            {!hideBottomNav && <BottomNavigation/>}
        </AppShell>
    );
}

export default function App() {
    return (
        <Routes>
            {/* AppShell 래이아웃 */}
            <Route element={<AppLayout/>}>
                {/* 화면 라우팅 */}
                <Route path="/" element={<HomeScreen/>}/>
                <Route path="/loading" element={<LoadingScreen/>}/>
                <Route path="/signup" element={<SignupScreen/>}/>
                <Route path="/login" element={<LoginScreen/>}/>
                <Route path="/test" element={<ConsumerTypeTest/>}/>
                <Route path="/explore" element={<ExploreMapScreen/>}/>
                <Route path="/ranking" element={<RankingScreen/>}/>
                <Route path="/mypage" element={<MyPageScreen/>}/>
                <Route path="/mypage/login" element={<LoginInfoScreen/>}/>
                <Route path="/mypage/reviews" element={<MyReviewsScreen/>}/>
                <Route path="/review/new/:storeId" element={<ReviewWritePage/>}/>
                {/* 안전망: 정의되지 않은 경로는 홈으로 */}
                <Route path="*" element={<HomeScreen/>}/>
            </Route>
        </Routes>
    );
}