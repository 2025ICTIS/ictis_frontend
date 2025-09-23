import { apiClient } from "@/lib/apiClient";

/** 서버 응답 스키마 */
export type RankingApiUser = {
  nickname: string;
  amountOfFirst: number; // 첫 발견 수
  amountOfReview: number; // 리뷰 수
};

export type RankingApiResponse = {
  users: RankingApiUser[];
};

/** GET /user/show/ranking  */
export async function fetchRanking(): Promise<RankingApiResponse> {
  const res = await apiClient.get<RankingApiResponse>("/user/show/ranking");
  // apiClient가 data만 반환/혹은 axios-response를 반환할 수 있어서 양쪽 케이스 모두 처리
  return (res as any)?.data ?? res;
}
