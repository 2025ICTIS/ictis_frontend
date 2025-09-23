export const APP_CONFIG = {
    name: "충남 탐험가",
    version: "1.0.0",
    description: "충남의 숨은 상권을 발견하고 스탬프를 모아보세요",
};

export const SCREENS = {
    LOADING: "loading",
    SIGNUP: "signup",
    LOGIN: "login",
    HOME: "home",
    TEST: "test",
    EXPLORE: "explore",
    RANKING: "ranking",
    MYPAGE: "mypage",
} as const;

export const CONSUMER_TYPES = {
    EXPLORER: "발빠른 모험가",
    FOODIE: "미식가",
    TRENDSETTER: "트렌드세터",
    CAFE_LOVER: "카페러버",
    CULTURE_SEEKER: "문화탐방가",
} as const;

// ... existing code ...
export const DISTRICTS = {
    CHEONAN_DONGNAM: "천안시 동남구",
    CHEONAN_SEOBUK: "천안시 서북구",
    GONGJU: "공주시",
    BORYEONG: "보령시",
    ASAN: "아산시",
    SEOSAN: "서산시",
    NONSAN: "논산시",
    GYERYONG: "계룡시",
    DANGJIN: "당진시",
    GEUMSAN_GUN: "금산군",
    BUYEO_GUN: "부여군",
    SEOCHON_GUN: "서천군",
    CHEONGYANG_GUN: "청양군",
    HONGSEONG_GUN: "홍성군",
    YESAN_GUN: "예산군",
    TAEAN_GUN: "태안군",
} as const;

export const CATEGORIES = {
    CAFE: "카페",
    RESTAURANT: "음식점",
    CULTURE: "문화",
    SHOPPING: "쇼핑",
    ENTERTAINMENT: "엔터테인먼트",
    BEAUTY: "뷰티",
    FITNESS: "피트니스",
    EDUCATION: "교육",
} as const;

export const STAMPS = {
    VISIT: 1,
    REVIEW: 2,
    FIRST_DISCOVERY: 5,
    PHOTO_REVIEW: 3,
    DETAILED_REVIEW: 4,
} as const;

export const RANKING_TYPES = {
    EXPLORER: "explorer",
    DISCOVERER: "discoverer",
    REVIEWER: "reviewer",
} as const;

// ---------------- 추가: 소비자 테스트 공통 상수/타입 ----------------
export type QuestionKind = "gender" | "age" | "district" | "score";

export type Option = { id: string; text: string };

export type Question = {
    id: string;
    kind: QuestionKind;
    title: string;
    options: Option[];
};

// 충남 시·군·구 리스트(테스트용 선택지에 사용)
export const CHUNGNAM_DISTRICTS: string[] = [
    DISTRICTS.CHEONAN_DONGNAM,
    DISTRICTS.CHEONAN_SEOBUK,
    DISTRICTS.GONGJU,
    DISTRICTS.BORYEONG,
    DISTRICTS.ASAN,
    DISTRICTS.SEOSAN,
    DISTRICTS.NONSAN,
    DISTRICTS.GYERYONG,
    DISTRICTS.DANGJIN,
    DISTRICTS.GEUMSAN_GUN,
    DISTRICTS.BUYEO_GUN,
    DISTRICTS.SEOCHON_GUN,
    DISTRICTS.CHEONGYANG_GUN,
    DISTRICTS.HONGSEONG_GUN,
    DISTRICTS.YESAN_GUN,
    DISTRICTS.TAEAN_GUN,
];

// 선택지 id → API payload 한글 라벨 매핑
export const GENDER_MAP: Record<string, string> = {
    male: "남자",
    female: "여자",
};

export const AGE_MAP: Record<string, string> = {
    "10s": "10대",
    "20s": "20대",
    "30s": "30대",
    "40s": "40대",
    "50p": "50대 이상",
};

// 테스트 질문(앞 3개는 인구통계)
export const TEST_QUESTIONS: Question[] = [
    {
        id: "gender",
        kind: "gender",
        title: "성별을 선택해 주세요",
        options: [
            { id: "male", text: "남성" },
            { id: "female", text: "여성" },
        ],
    },
    {
        id: "age",
        kind: "age",
        title: "연령대를 선택해 주세요",
        options: [
            { id: "10s", text: "10대" },
            { id: "20s", text: "20대" },
            { id: "30s", text: "30대" },
            { id: "40s", text: "40대" },
            { id: "50p", text: "50대 이상" },
        ],
    },
    {
        id: "district",
        kind: "district",
        title: "충청남도 시·군·구를 선택해 주세요",
        options: CHUNGNAM_DISTRICTS.map((d) => ({ id: d, text: d })),
    },
];