export type RecommendPayload = {
  gender: string;
  age: string; // store의 ageRange를 그대로 넘겨도 OK
  address: string; // store의 district 사용
};

/** 백엔드 응답 스펙 (longtitude 철자까지 대응) */
export type RecommendItem = {
  name: string;
  address: string;
  hours?: string;
  description?: string;
  latitude?: number;
  longtitude?: number;
};
