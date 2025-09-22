// API 베이스 URL 결정 로직
// - 개발에서 Vite 프록시를 쓰려면 .env에 VITE_USE_VITE_PROXY=true 설정 후 /api 사용
// - 아니면 VITE_API_BASE_URL 사용
const useProxy = import.meta.env.DEV && import.meta.env.VITE_USE_VITE_PROXY === "true";
const baseURL = useProxy ? "/api" : (import.meta.env.VITE_API_BASE_URL as string | undefined);

if (!baseURL) {
    // 개발 환경에서 프록시를 안 쓰고, .env도 없는 경우 경고
    console.warn("[apiClient] baseURL이 설정되지 않았습니다. .env에 VITE_API_BASE_URL 또는 VITE_USE_VITE_PROXY=true를 설정하세요.");
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

    const res = await fetch(url, {
        method: options.method ?? "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
        // 필요 시 credentials, mode 등 추가
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (!res.ok) {
        const errText = isJson ? JSON.stringify(await res.json()).slice(0, 500) : (await res.text()).slice(0, 500);
        throw new Error(errText || `HTTP ${res.status}`);
    }

    return (isJson ? res.json() : (res.text() as any)) as T;
}

export const apiClient = {
    get: <T = unknown>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
        request<T>(path, { ...options, method: "GET" }),
    post: <T = unknown>(path: string, body?: any, options?: Omit<RequestOptions, "method">) =>
        request<T>(path, { ...options, method: "POST", body }),
    put: <T = unknown>(path: string, body?: any, options?: Omit<RequestOptions, "method">) =>
        request<T>(path, { ...options, method: "PUT", body }),
    patch: <T = unknown>(path: string, body?: any, options?: Omit<RequestOptions, "method">) =>
        request<T>(path, { ...options, method: "PATCH", body }),
    delete: <T = unknown>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
        request<T>(path, { ...options, method: "DELETE" }),
};