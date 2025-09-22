import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getRecommendations } from "@/features/recommend/api";
import type { RecommendItem, RecommendPayload } from "@/types/recommendation";

// ---- 중복 제거/캐시 (모듈 스코프) ----------------------------
const inFlight = new Map<string, Promise<RecommendItem[]>>();
const cache = new Map<string, { ts: number; data: RecommendItem[] }>();
const TTL_MS = 5000; // 5초 캐시 (원하면 조절)

function keyOf(p: RecommendPayload) {
  return `${p.gender}|${p.age}|${p.address}`;
}

async function fetchDedupe(
  payload: RecommendPayload
): Promise<RecommendItem[]> {
  const key = keyOf(payload);

  // 1) TTL 캐시
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return cached.data;
  }

  // 2) 같은 키로 진행 중인 요청 있으면 그거 재사용
  const existing = inFlight.get(key);
  if (existing) return existing;

  // 3) 새 요청 수행
  const req = getRecommendations(payload)
    .then((data) => {
      cache.set(key, { ts: Date.now(), data: Array.isArray(data) ? data : [] });
      inFlight.delete(key);
      return cache.get(key)!.data;
    })
    .catch((e) => {
      inFlight.delete(key);
      throw e;
    });

  inFlight.set(key, req);
  return req;
}
// ------------------------------------------------------------

export function useRecommendations(opts?: {
  payload?: Partial<RecommendPayload>;
}) {
  const user = useAppStore((s) => s.user);

  // 기본 payload: 유저 정보 기반
  const base: RecommendPayload = useMemo(
    () => ({
      gender: user?.gender ?? "unknown",
      age: user?.ageRange ?? "20s",
      address: user?.district ?? "부산광역시",
    }),
    [user?.gender, user?.ageRange, user?.district]
  );

  const payload: RecommendPayload = useMemo(
    () => ({
      gender: opts?.payload?.gender ?? base.gender,
      age: opts?.payload?.age ?? base.age,
      address: opts?.payload?.address ?? base.address,
    }),
    [opts?.payload?.gender, opts?.payload?.age, opts?.payload?.address, base]
  );

  const [data, setData] = useState<RecommendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetchDedupe(payload)
      .then((list) => {
        if (mounted) setData(list);
      })
      .catch((e) => {
        if (mounted) setError(e);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [payload.gender, payload.age, payload.address]); // payload가 진짜 바뀔 때만

  const refetch = async (override?: Partial<RecommendPayload>) => {
    const merged: RecommendPayload = {
      gender: override?.gender ?? payload.gender,
      age: override?.age ?? payload.age,
      address: override?.address ?? payload.address,
    };
    setLoading(true);
    setError(null);
    try {
      const list = await fetchDedupe(merged);
      setData(list);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch, payload };
}
