import {apiClient} from "@/lib/apiClient";

/* ─────────────────────────────────────────────
 * 주소 일부(addressPart)로 매장 검색
 * GET /stroe/list?addressPart=...
 * 응답 예:
 * {
 *   "storeList": [
 *     {
 *       "id": 1,
 *       "name": "해운대 구역살이",
 *       "address": "부산광역시 해운대구 우동 620-5",
 *       "hours": "12시 - 21시",
 *       "description": "신선한 고기와 정감있는 분위기를 즐길 수 있는 고기집",
 *       "latitude": 35.158718,
 *       "longtitude": 129.160487,
 *       "firstUserId": 1,
 *       "board": [{ "id": 3, "postedTime": "...", "content": "..." }],
 *       "favorite": []
 *     }
 *   ]
 * }
 * ───────────────────────────────────────────── */
export type SearchStoreBoard = {
    id: number;
    postedTime: string;
    content: string;
};

export type SearchStoreItem = {
    id: number;
    name: string;
    address: string;
    hours: string;
    description?: string;
    latitude?: number;
    longtitude?: number;
    firstUserId?: number | null;
    board: SearchStoreBoard[];
    favorite: unknown[];
};

export type SearchStoresResponse = {
    storeList: SearchStoreItem[];
};

export async function searchStoresByAddress(addressPart: string): Promise<SearchStoreItem[]> {
    const query = new URLSearchParams({addressPart: String(addressPart ?? "")}).toString();
    const path = `/store/list?${query}`;
    try {
        const res = await apiClient.get<SearchStoresResponse>(path);
        return Array.isArray((res as any)?.storeList) ? (res as any).storeList : [];
    } catch (e) {
        // Fallback: 일부 서버는 GET 쿼리 파라미터 대신 바디를 요구할 수 있음
        try {
            const res = await apiClient.post<SearchStoresResponse>("/stroe/list", {addressPart: String(addressPart ?? "")});
            return Array.isArray((res as any)?.storeList) ? (res as any).storeList : [];
        } catch {
            throw e;
        }
    }
}
