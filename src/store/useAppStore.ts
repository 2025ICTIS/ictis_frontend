import { create } from "zustand";

export interface User {
    name: string;
    nickname: string;
    password: string;
    consumerType?: string;
    stamps: number;
    reviews: number;
    hasCompletedTest?: boolean;
    gender?: string;
    ageRange?: string;
    district?: string;
}

export interface Review {
    id: number;
    storeId: number;
    userName: string;
    content: string;
    rating: number;
    images: string[];
    createdAt: string;
    likes: number;
}

export interface Store {
    id: number;
    name: string;
    category: string;
    district: string;
    address: string;
    hours: string;
    image?: string;
    reviews: Review[];
    visitCount: number;
}

export interface AppState {
    currentScreen:
        | "loading" | "signup" | "login" | "home" | "test" | "explore" | "ranking" | "mypage";
    user: User | null;
    isLoggedIn: boolean;

    currentQuestionIndex: number;
    testAnswers: string[];

    stores: Store[];
    recommendedStores: Store[];

    plannedVisitIds: number[];
    visitedStoreIds: number[];
    reviewedStoreIds: number[];

    showLoginModal: boolean;

    setCurrentScreen: (screen: AppState["currentScreen"]) => void;
    setUser: (user: User | null) => void;
    login: (user: User) => void;
    logout: () => void;

    setCurrentQuestionIndex: (index: number) => void;
    setTestAnswers: (answers: string[]) => void;
    addTestAnswer: (answer: string) => void;

    setShowLoginModal: (show: boolean) => void;
    updateUserStamps: (stamps: number) => void;

    addReview: (review: Review) => void;
    completeTest: (consumerType: string) => void;

    addPlannedVisit: (storeId: number) => void;
    removePlannedVisit: (storeId: number) => void;
    markVisited: (storeId: number) => void;
    markReviewed: (storeId: number) => void;

    setStores: (stores: Store[]) => void;
    seedStores: () => void;
    getStoreById: (id: number) => Store | undefined;

    setUserDemographics: (p: { gender: string; ageRange: string; district: string }) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    currentScreen: "loading",
    user: null,
    isLoggedIn: false,

    currentQuestionIndex: 0,
    testAnswers: [],

    stores: [],
    recommendedStores: [],

    plannedVisitIds: [],
    visitedStoreIds: [],
    reviewedStoreIds: [],

    showLoginModal: false,

    setCurrentScreen: (screen) => set({ currentScreen: screen }),
    setUser: (user) => set({ user, isLoggedIn: !!user }),

    login: (user) => set({ user, isLoggedIn: true, currentScreen: "home" }),
    logout: () => set({ user: null, isLoggedIn: false, currentScreen: "signup" }),

    setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
    setTestAnswers: (answers) => set({ testAnswers: answers }),
    addTestAnswer: (answer) => set((s) => ({ testAnswers: [...s.testAnswers, answer] })),

    setShowLoginModal: (show) => set({ showLoginModal: show }),
    updateUserStamps: (stamps) =>
        set((s) => ({ user: s.user ? { ...s.user, stamps } : null })),

    addReview: (review) =>
        set((s) => ({
            stores: s.stores.map((store) =>
                store.id === review.storeId
                    ? { ...store, reviews: [...store.reviews, review] }
                    : store
            ),
        })),

    completeTest: (consumerType) =>
        set((s) => ({
            user: s.user ? { ...s.user, consumerType, hasCompletedTest: true } : null,
        })),

    addPlannedVisit: (storeId) =>
        set((s) => ({
            plannedVisitIds: s.plannedVisitIds.includes(storeId)
                ? s.plannedVisitIds
                : [...s.plannedVisitIds, storeId],
        })),

    removePlannedVisit: (storeId) =>
        set((s) => ({ plannedVisitIds: s.plannedVisitIds.filter((id) => id !== storeId) })),

    markVisited: (storeId) =>
        set((s) => ({
            visitedStoreIds: s.visitedStoreIds.includes(storeId)
                ? s.visitedStoreIds
                : [...s.visitedStoreIds, storeId],
            plannedVisitIds: s.plannedVisitIds.filter((id) => id !== storeId),
            stores: s.stores.map((st) =>
                st.id === storeId ? { ...st, visitCount: (st.visitCount ?? 0) + 1 } : st
            ),
        })),

    markReviewed: (storeId) => {
        const already = get().reviewedStoreIds.includes(storeId);
        set((s) => ({
            reviewedStoreIds: already ? s.reviewedStoreIds : [...s.reviewedStoreIds, storeId],
            user: s.user
                ? { ...s.user, reviews: already ? s.user.reviews : (s.user.reviews ?? 0) + 1 }
                : s.user,
        }));
    },

    setStores: (stores) => set({ stores }),

    seedStores: () => {
        const { stores } = get();
        if (stores.length > 0) return;
        const demo: Store[] = [
            {
                id: 201,
                name: "천안 두정동 카페 로스터리",
                category: "카페",
                district: "천안시 서북구 두정동",
                address: "충남 천안시 서북구 두정중10길 12",
                hours: "매일 10:00 ~ 21:00 (월요일 휴무)",
                image: "/images/sample/cafe.jpg",
                reviews: [],
                visitCount: 0,
            },
            {
                id: 202,
                name: "아산 곡교천 피자",
                category: "피자",
                district: "아산시 배방읍",
                address: "충남 아산시 배방읍 어의달길 23",
                hours: "매일 11:00 ~ 22:00 (브레이크 15:00 ~ 17:00)",
                image: "/images/sample/pizza.jpg",
                reviews: [],
                visitCount: 0,
            },
            {
                id: 203,
                name: "공주 성당골 베이커리",
                category: "베이커리",
                district: "공주시 웅진동",
                address: "충남 공주시 웅진로 78",
                hours: "평일 09:00 ~ 20:00, 주말 10:00 ~ 19:00",
                image: "/images/sample/bread.jpg",
                reviews: [],
                visitCount: 0,
            },
        ];
        set({ stores: demo });
    },

    getStoreById: (id) => get().stores.find((s) => s.id === id),

    setUserDemographics: ({ gender, ageRange, district }) =>
        set((s) => ({ user: s.user ? { ...s.user, gender, ageRange, district } : null })),
}));