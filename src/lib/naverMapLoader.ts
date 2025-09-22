let p: Promise<void> | null = null;

export function loadNaverMaps(clientId: string): Promise<void> {
  // 이미 올라와 있으면 즉시 resolve
  if ((window as any).naver?.maps) return Promise.resolve();

  if (p) return p;

  p = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-naver-maps="true"]'
    );
    if (existing) {
      waitUntilReady(resolve);
      return;
    }

    const s = document.createElement("script");
    s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`;
    s.defer = true;
    s.async = true;
    s.dataset.naverMaps = "true";
    s.onload = () => waitUntilReady(resolve);
    s.onerror = () => reject(new Error("Failed to load Naver Maps JS"));
    document.head.appendChild(s);
  });

  return p;
}

function waitUntilReady(done: () => void) {
  const tick = () => {
    const ok = (window as any).naver?.maps;
    if (ok) done();
    else setTimeout(tick, 15);
  };
  tick();
}
