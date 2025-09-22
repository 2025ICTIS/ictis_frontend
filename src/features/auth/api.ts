import { apiClient } from "@/lib/apiClient";

export type SignupPayload = {
    username: string;
    nickname: string;
    password: string;
};

export type LoginPayload = {
    username: string;
    password: string;
};

// 서버 응답 형태에 맞게 타입을 조정하세요
export type SignupResponse = unknown;

export async function signup(payload: SignupPayload): Promise<{ status: number; body?: SignupResponse }> {
    // 201 여부 확인을 위해 RAW 호출 사용
    const res = await apiClient.postRaw("/user/create", payload);
    let body: any = undefined;
    try {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) body = await res.json();
        else body = await res.text();
    } catch {
        // body 파싱 실패는 무시
    }
    if (!res.ok) {
        throw new Error((typeof body === "string" ? body : JSON.stringify(body)) || `HTTP ${res.status}`);
    }
    return { status: res.status, body };
}

// 토큰/프로필 등 실제 응답에 맞게 타입 정의
export type LoginResponse = unknown;

export async function login(payload: LoginPayload): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>("/login", payload);
}