// API 베이스 URL 결정 로직
// - 개발에서 Vite 프록시를 쓰려면 .env에 VITE_USE_VITE_PROXY=true 설정 후 /api 사용
// - 아니면 VITE_API_BASE_URL 사용
const useProxy = import.meta.env.DEV && import.meta.env.VITE_USE_VITE_PROXY === "true";
const baseURL = useProxy ? "/api" : (import.meta.env.VITE_API_BASE_URL as string | undefined);

if (!baseURL) {
    console.warn(
        "[apiClient] baseURL이 설정되지 않았습니다. .env에 VITE_API_BASE_URL 또는 VITE_USE_VITE_PROXY=true를 설정하세요."
    );
}

// ─────────────────────────────────────────────────────────────
// Authorization 토큰 관리 (자동 첨부 + 응답 헤더에서 자동 갱신)
// ─────────────────────────────────────────────────────────────
let authToken: string | null = null;
const TOKEN_KEY = "auth.token";

// 앱 시작 시 저장소에서 복원
try {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) authToken = saved;
} catch { /* ignore */
}

export function setAuthToken(token: string | null) {
    authToken = token;
    try {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
    } catch { /* ignore */
    }
}

export function getAuthToken() {
    return authToken;
}

type RequestOptions = {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: Record<string, string>;
    body?: any;
    signal?: AbortSignal;
};

async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    if (!baseURL) throw new Error("API baseURL이 설정되지 않았습니다.");
    const url = `${baseURL}${path}`;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };
    // Authorization 자동 첨부 (호출부에서 명시적으로 넣으면 우선)
    if (authToken && !headers.Authorization && !headers.authorization) {
        headers.Authorization = `Bearer ${authToken}`;
    }

    const res = await fetch(url, {
        method: options.method ?? "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
    });

    // 응답에서 Authorization 갱신(로그인/리프레시 등)
    const authHeader = res.headers.get("authorization") || res.headers.get("Authorization");
    if (authHeader) {
        // "Bearer xxx" 형태면 Bearer 제거하고 저장해도 되고, 그대로 저장해도 됩니다.
        // 여기서는 토큰만 보관합니다.
        const maybeToken = authHeader.replace(/^Bearer\s+/i, "").trim();
        if (maybeToken) setAuthToken(maybeToken);
    }

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (!res.ok) {
        const errText = isJson ? JSON.stringify(await res.json()).slice(0, 500) : (await res.text()).slice(0, 500);
        throw new Error(errText || `HTTP ${res.status}`);
    }

    return (isJson ? res.json() : (res.text() as any)) as T;
}

// 원본 Response가 필요할 때(status 코드 확인 등)
async function requestRaw(path: string, options: RequestOptions = {}): Promise<Response> {
    if (!baseURL) throw new Error("API baseURL이 설정되지 않았습니다.");
    const url = `${baseURL}${path}`;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };
    // Authorization 자동 첨부
    if (authToken && !headers.Authorization && !headers.authorization) {
        headers.Authorization = `Bearer ${authToken}`;
    }

    const res = await fetch(url, {
        method: options.method ?? "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
    });

    // 응답에서 Authorization 갱신
    const authHeader = res.headers.get("authorization") || res.headers.get("Authorization");
    if (authHeader) {
        const maybeToken = authHeader.replace(/^Bearer\s+/i, "").trim();
        if (maybeToken) setAuthToken(maybeToken);
    }

    return res;
}

export const apiClient = {
    get: <T = unknown>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
        request<T>(path, {...options, method: "GET"}),
    post: <T = unknown>(path: string, body?: any, options?: Omit<RequestOptions, "method">) =>
        request<T>(path, {...options, method: "POST", body}),
    put: <T = unknown>(path: string, body?: any, options?: Omit<RequestOptions, "method">) =>
        request<T>(path, {...options, method: "PUT", body}),
    patch: <T = unknown>(path: string, body?: any, options?: Omit<RequestOptions, "method">) =>
        request<T>(path, {...options, method: "PATCH", body}),
    delete: <T = unknown>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
        request<T>(path, {...options, method: "DELETE"}),

    // 상태 코드 확인/헤더 접근용 RAW 메서드
    postRaw: (path: string, body?: any, options?: Omit<RequestOptions, "method">) =>
        requestRaw(path, {...options, method: "POST", body}),
};
