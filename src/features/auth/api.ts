import { apiClient } from "@/lib/apiClient";

export type SignupPayload = {
    username: string;
    nickname: string;
    password: string;
};

// 서버 응답 형태에 맞게 타입을 조정하세요
export type SignupResponse = unknown;

export async function signup(payload: SignupPayload): Promise<SignupResponse> {
    // 백엔드 계약에 맞춰 엔드포인트 지정
    return apiClient.post<SignupResponse>("/user/create", payload);
}