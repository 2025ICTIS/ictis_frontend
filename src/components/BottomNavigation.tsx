import { Link, useLocation } from "react-router-dom";

const tabs = [
    { to: "/explore", label: "탐색" },
    { to: "/ranking", label: "랭킹" },
    { to: "/test", label: "테스트" },
    { to: "/mypage", label: "마이" },
];

export default function BottomNavigation() {
    const { pathname } = useLocation();
    return (
        <nav
            className="fixed left-1/2 bottom-0 z-[150] w-full max-w-[420px] -translate-x-1/2 bg-white/95 shadow-[0_-6px_16px_rgba(0,0,0,.06)] backdrop-blur"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <ul className="grid grid-cols-4">
                {tabs.map((t) => {
                    const active = pathname.startsWith(t.to);
                    return (
                        <li key={t.to} className="text-center">
                            <Link
                                to={t.to}
                                className={`block py-3 text-sm ${active ? "text-blue-600 font-semibold" : "text-gray-600"}`}
                            >
                                {t.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}