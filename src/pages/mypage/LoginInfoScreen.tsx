import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";

export const LoginInfoScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAppStore();

    return (
        // AppShell이 프레임/배경/높이를 관리하므로, 여기선 꽉 채우고 내부만 스크롤
        <div className="w-full h-full flex flex-col overflow-hidden bg-white">
            {/* 헤더 */}
            <header className="px-5 py-4 shadow-sm bg-white">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-100"
                        aria-label="뒤로가기"
                    >
                        ←
                    </button>
                    <h1 className="text-base font-semibold text-gray-900">로그인 정보</h1>
                </div>
            </header>

            {/* 메인: 내부 스크롤 */}
            <main
                className="flex-1 min-h-0 px-5 py-5 overflow-y-auto"
                style={{
                    paddingTop: "env(safe-area-inset-top)",
                    paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)", // 하단 탭 높이 고려
                }}
            >
                <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-gray-200 bg-white">
                    <Row label="이름" value={user?.name ?? "-"} />
                    <Divider />
                    <Row label="닉네임" value={user?.nickname ?? "-"} />
                    <Divider />
                    <Row
                        label="비밀번호"
                        value={
                            "•".repeat(Math.max(6, user?.password?.length ?? 0)) || "******"
                        }
                    />
                    <Divider />
                    <Divider />
                    <Row label="스탬프" value={`${user?.stamps ?? 0}개`} />
                    <Divider />
                    <Row label="작성한 리뷰" value={`${user?.reviews ?? 0}개`} />
                </div>
            </main>
        </div>
    );
};

const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between px-4 py-4">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
    </div>
);

const Divider = () => <hr className="border-gray-200" />;

export default LoginInfoScreen;