import {apiClient, setAuthToken} from "@/lib/apiClient";

export type SignupPayload = {
    username: string;
    nickname: string;
    password: string;
};

export type LoginPayload = {
    username: string;
    password: string;
};

export type SignupResponse = unknown;

export async function signup(payload: SignupPayload): Promise<{ status: number; body?: SignupResponse }> {
    const res = await apiClient.postRaw("/user/create", payload);
    let body: any = undefined;
    try {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) body = await res.json();
        else body = await res.text();
    } catch {
    }
    if (!res.ok) {
        throw new Error((typeof body === "string" ? body : JSON.stringify(body)) || `HTTP ${res.status}`);
    }
    return {status: res.status, body};
}

export type LoginResponse =
    | { token: string }                           // 케이스 1: { token }
    | { accessToken: string }                     // 케이스 2: { accessToken }
    | { data?: { token?: string; accessToken?: string } } // 케이스 3: { data: { token | accessToken } }
    | Record<string, any>;

// 로그인: 바디에서 토큰 추출 → setAuthToken 저장
export async function login(payload: LoginPayload): Promise<LoginResponse> {
    // 헤더가 아니라 "바디"에서 토큰을 받는 계약에 맞춰 post 사용
    const body = (await apiClient.post<LoginResponse>("/login", payload)) as LoginResponse;

    // 다양한 응답 포맷 대비 안전하게 토큰 추출
    const token =
        (body as any)?.token ??
        (body as any)?.accessToken ??
        (body as any)?.data?.token ??
        (body as any)?.data?.accessToken ??
        null;

    if (typeof token === "string" && token.trim().length > 0) {
        setAuthToken(token.trim());
    } else {
        // 필요 시 디버깅용 로그(운영에서는 제거 가능)
        console.warn("[login] 응답 바디에서 토큰을 찾지 못했습니다. 응답:", body);
    }

    return body;
}

/* ─────────────────────────────────────────────
 * 회원 정보 조회 (Authorization 자동 첨부)
 * GET /user/show/information
 * ───────────────────────────────────────────── */
export type UserInformation = {
    name?: string;
    nickname?: string;
    consumerType?: string;
    stamps?: number;
    reviews?: number;
    // 서버가 추가로 주는 필드가 있다면 여기에 확장
};

export async function fetchUserInformation(): Promise<UserInformation> {
    // apiClient가 로컬에 저장된 토큰을 Authorization: Bearer ... 로 자동 첨부합니다.
    const res = await apiClient.get<UserInformation>("/user/show/information");
    // 서버가 { data: {...} } 형태라면 아래처럼 보정:
    // return (res as any)?.data ?? (res as UserInformation);
    return res as UserInformation;
}

/* ─────────────────────────────────────────────
 * 나의 리뷰 목록 조회 (Authorization 자동 첨부)
 * GET /user/show/myReview
 * 서버 응답:
 * {
 *   "board": [
 *     { "id": 3, "postedTime": "2025-09-02T15:42:05.347228", "content": "테스트용" }
 *   ]
 * }
 * ───────────────────────────────────────────── */
export type MyReviewApiItem = {
    id: number;
    postedTime: string; // ISO string
    content: string;
};

export type MyReviewApiResponse = {
    board: MyReviewApiItem[];
};

/** 원본 응답 그대로 반환 */
export async function fetchMyReviewsRaw(): Promise<MyReviewApiResponse> {
    const res = await apiClient.get<MyReviewApiResponse>("/user/show/myReview");
    return res as MyReviewApiResponse;
}

/** 화면 공용 포맷으로 변환(옵션) */
export type MyReview = {
    id: number;
    createdAt: string; // postedTime → createdAt
    content: string;
};

export async function fetchMyReviews(): Promise<MyReview[]> {
    const res = await fetchMyReviewsRaw();
    const list = Array.isArray(res?.board) ? res.board : [];
    return list.map((it) => ({
        id: it.id,
        createdAt: it.postedTime,
        content: it.content,
    }));
}
