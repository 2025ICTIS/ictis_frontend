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