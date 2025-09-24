let p: Promise<void> | null = null;

function waitUntilReady(
    resolve: () => void,
    reject: (err: any) => void,
    timeoutMs = 15000
) {
    const start = Date.now();
    (function check() {
        const n = (window as any).naver;
        if (n?.maps) {
            console.debug("[naverMapLoaderV3] SDK ready (window.naver.maps present)");
            resolve();
            return;
        }
        if (Date.now() - start > timeoutMs) {
            console.error("[naverMapLoaderV3] waitUntilReady timeout");
            reject(new Error("[naverMapLoaderV3] SDK not available within timeout"));
            return;
        }
        setTimeout(check, 50);
    })();
}

function cleanupStaleScriptTags() {
    const all = Array.from(
        document.querySelectorAll<HTMLScriptElement>(
            'script[src*="oapi.map.naver.com/openapi/v3/maps.js"]'
        )
    );
    all.forEach((s) => {
        if (!s.dataset.naverMaps) {
            console.warn("[naverMapLoaderV3] Removing stale maps.js tag without data attribute");
            s.remove();
        }
    });
}

export function loadNaverMapsV3(clientId: string): Promise<void> {
    console.log("[naverMapLoaderV3] called with clientId:", clientId);

    if ((window as any).naver?.maps) {
        console.debug("[naverMapLoaderV3] Already loaded");
        return Promise.resolve();
    }

    if (p) {
        console.debug("[naverMapLoaderV3] Reusing in-flight Promise");
        return p;
    }

    if (!clientId) {
        return Promise.reject(new Error("[naverMapLoaderV3] clientId is empty"));
    }

    cleanupStaleScriptTags();

    p = new Promise<void>((resolve, reject) => {
        console.debug("[naverMapLoaderV3] Begin loading script, clientId:", clientId);

        const existing = document.querySelector<HTMLScriptElement>(
            'script[data-naver-maps="true"]'
        );
        console.log("[naverMapLoaderV3] Existing script tag:", existing);

        if (existing) {
            console.debug("[naverMapLoaderV3] Tag already exists, waiting...");
            waitUntilReady(resolve, reject, 20000);
            return;
        }

        // 콜백 경로
        (window as any).__onNaverMapsReady = () => {
            console.debug("[naverMapLoaderV3] __onNaverMapsReady invoked");
            waitUntilReady(resolve, reject, 20000);
        };

        const s = document.createElement("script");
        s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder&callback=__onNaverMapsReady`;
        s.defer = true;
        s.async = true;
        s.dataset.naverMaps = "true";
        s.onerror = () => {
            console.error("[naverMapLoaderV3] Script load error");
            reject(new Error("Failed to load Naver Maps JS"));
        };
        // onload 경로(콜백이 안 와도 대비)
        s.onload = () => {
            console.debug("[naverMapLoaderV3] script onload fired");
            waitUntilReady(resolve, reject, 20000);
        };
        document.head.appendChild(s);

        // append 직후 즉시 폴링(이중 안전망)
        waitUntilReady(resolve, reject, 20000);
    });

    return p;
}