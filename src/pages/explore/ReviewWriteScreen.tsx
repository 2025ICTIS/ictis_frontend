import {useEffect, useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useAppStore} from "@/store/useAppStore";

type Step = 1 | 2 | 3;

export const ReviewWritePage: React.FC = () => {
    const navigate = useNavigate();
    const {storeId} = useParams<{ storeId: string }>();
    const id = Number(storeId);

    const {
        user,
        addReview,
        markVisited,
        markReviewed,
        seedStores,
        getStoreById,
        setCurrentScreen,
    } = useAppStore();

    useEffect(() => {
        seedStores();
    }, [seedStores]);

    const store = useMemo(() => getStoreById(id), [getStoreById, id]);

    // 데모: 스토어가 없으면 간단한 더미로 표시(선택)
    const targetName = store?.name ?? "핫플왓플 가게";

    const [step, setStep] = useState<Step>(1);

    // STEP1: 태그
    const GROUPS: { title: string; tags: string[] }[] = [
        {
            title: "음식/가격",
            tags: ["맛있어요", "특별한 메뉴가 있어요", "메뉴 구성이 다양해요", "신선해요", "가성비가 좋아요"],
        },
        {
            title: "분위기",
            tags: ["아늑해요", "사진이 잘 나와요", "뷰가 좋아요", "집중하기 좋아요", "인테리어가 멋져요"],
        },
        {
            title: "편의/서비스",
            tags: ["매장이 청결해요", "주차하기 편해요", "교통이 편리해요", "직원분이 친절해요"],
        },
    ];
    const [selectedTags, setSelectedTags] = useState<string[]>(["맛있어요", "사진이 잘 나와요", "매장이 청결해요"]);
    const toggleTag = (t: string) =>
        setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

    // STEP2: 사진 + 텍스트
    const [text, setText] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const previews = files.map((f) => URL.createObjectURL(f));
    const limit = 500;

    const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const list = Array.from(e.target.files || []);
        setFiles((prev) => [...prev, ...list].slice(0, 10));
    };

    const submit = () => {
        // 저장 & 상태 업데이트
        const images = previews;
        addReview({
            id: Date.now(),
            storeId: id,
            userName: user?.nickname ?? "익명",
            content: `${selectedTags.map((t) => `#${t}`).join(" ")}\n${text}`.trim(),
            rating: 5,
            images,
            createdAt: new Date().toISOString().slice(0, 10),
            likes: 0,
        });
        markVisited(id);
        markReviewed(id);
        setStep(3);
    };

    const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/"));

    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-white">
            {/* 헤더 */}
            {step !== 3 && (
                <header className="sticky top-0 z-10 px-4 py-3 bg-white shadow-sm">
                    <div className="flex items-center gap-2">
                        <button onClick={goBack} className="px-2 py-1 rounded-lg hover:bg-gray-100 cursor-pointer">
                            ←
                        </button>
                        <h1 className="text-base font-semibold truncate">{targetName} 리뷰 작성</h1>
                    </div>
                </header>
            )}

            {/* 콘텐츠 */}
            <main className="flex-1 min-h-0 px-5 py-5 overflow-y-auto">
                {/* STEP 1 */}
                {step === 1 && (
                    <>
                        <h2 className="mb-2 text-2xl font-extrabold">
                            {targetName}
                            <br/>
                            방문 후기를 남겨보세요!
                        </h2>
                        <p className="mb-5 text-sm text-gray-500">
                            어떤 점이 좋았나요? <span className="font-medium">1개 이상</span> 골라주세요.
                        </p>

                        <div className="space-y-6">
                            {GROUPS.map((g) => (
                                <div key={g.title}>
                                    <div className="mb-2 text-sm font-semibold">{g.title}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {g.tags.map((t) => {
                                            const active = selectedTags.includes(t);
                                            return (
                                                <button
                                                    key={t}
                                                    onClick={() => toggleTag(t)}
                                                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition ${
                                                        active ? "border-pink-300 bg-pink-50 text-pink-600" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {t}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={selectedTags.length === 0}
                            className={`mt-8 w-full rounded-xl py-4 text-white shadow cursor-pointer ${
                                selectedTags.length ? "bg-blue-700 hover:bg-blue-800" : "cursor-not-allowed bg-gray-300"
                            }`}
                        >
                            다음
                        </button>
                    </>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <>
                        <h2 className="mb-2 text-xl font-bold">{targetName}에 대해 남겨주세요</h2>
                        <p className="mb-4 text-sm text-gray-500">사진(선택)과 간단한 리뷰를 작성하면 돼요.</p>

                        <div className="space-y-6">

                            {/* 업로드 */}
                            <label className="block mb-4 cursor-pointer">
                                <div
                                    className="flex items-center justify-center w-full text-gray-500 bg-gray-100 h-36 rounded-2xl ring-1 ring-gray-200">
                                    <div className="text-center">
                                        <div className="mb-2 text-sm">사진 업로드</div>
                                        <div className="text-[11px] text-gray-400">* 영수증 사진도 포함하여 업로드해주세요</div>
                                    </div>
                                </div>
                                <input type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles}/>
                            </label>

                            {previews.length > 0 && (
                                <div className="flex gap-2 mb-4 overflow-x-auto">
                                    {previews.map((src, i) => (
                                        <div key={i}
                                             className="w-20 h-20 overflow-hidden bg-gray-200 rounded-lg shrink-0 ring-1 ring-gray-200">
                                            <img src={src} alt={`preview-${i}`} className="object-cover w-full h-full"/>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <textarea
                                rows={6}
                                value={text}
                                onChange={(e) => setText(e.target.value.slice(0, limit))}
                                placeholder="리뷰를 남겨주세요 (최대 500자)"
                                className="w-full p-4 border border-gray-300 outline-none resize-none rounded-2xl focus:border-gray-400"
                            />
                            <div className="mt-1 text-xs text-right text-gray-500">
                                {text.length} / {limit}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setStep(1)}
                                className="w-1/3 py-4 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer"
                            >
                                이전
                            </button>
                            <button
                                onClick={submit}
                                className="w-2/3 py-4 text-white bg-blue-700 shadow rounded-xl hover:bg-blue-800 cursor-pointer"
                            >
                                작성 완료
                            </button>
                        </div>
                    </>
                )}

                {/* STEP 3: 완료 */}
                {step === 3 && (
                    <div className="py-10 text-center">
                        <div
                            className="flex items-center justify-center w-20 h-20 mx-auto mb-6 text-3xl text-white bg-blue-700 rounded-full">
                            ✓
                        </div>
                        <h3 className="mb-2 text-lg font-bold">리뷰 등록을 완료했어요!</h3>
                        <p className="mb-8 text-sm text-gray-500">소중한 후기에 감사해요 🙌</p>
                        <button
                            onClick={() => {
                                setCurrentScreen("explore"); // 탐색 탭으로 전환
                                navigate(`/?open=${id}`, {replace: true}); // 상세로 바로 열기
                            }}
                            className="w-full py-4 text-white bg-blue-700 shadow rounded-xl hover:bg-blue-800 cursor-pointer"
                        >
                            뒤로 가기
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ReviewWritePage;