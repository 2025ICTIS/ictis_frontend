import { apiClient } from "@/lib/apiClient";

export type RecommendPayload = {
    gender: string;
    age: string;
    address: string;
};

export type RecommendItem = {
    name: string;
    address: string;
    hours: string;
    description: string;
    latitude: number;
    longtitude: number;
};

export async function getRecommendations(payload: RecommendPayload): Promise<RecommendItem[]> {
    return apiClient.post<RecommendItem[]>("/gpt/chat", payload);
}