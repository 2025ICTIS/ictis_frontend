import { apiClient } from "@/lib/apiClient";
import type { RecommendItem, RecommendPayload } from "@/types/recommendation";

export async function getRecommendations(
  payload: RecommendPayload
): Promise<RecommendItem[]> {
  // apiClient가 axios 스타일이라면 data를 꺼냅니다.
  const res = await apiClient.post<RecommendItem[]>("/gpt/chat", payload);
  // 만약 apiClient가 바로 data를 반환한다면 위 한 줄로 충분하고,
  // axios 인스턴스면: const { data } = await apiClient.post(...); return data;
  return res as RecommendItem[]; // 필요 시 위 주석대로 수정
}
