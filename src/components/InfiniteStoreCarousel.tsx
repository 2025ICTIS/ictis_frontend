import {useEffect, useRef, useState} from "react";

export function Tag({children}: { children: React.ReactNode }) {
    return (
        <span className="px-3 py-1 text-xs text-gray-700 rounded-full shadow bg-white/90 ring-1 ring-black/5">
      {children}
    </span>
    );
}

export function InfiniteStoreCarousel({
                                          items,
                                          onCardClick,
                                      }: {
    items: {
        id: number;
        name: string;
        image?: string;
        district?: string;
        category?: string;
    }[];
    onCardClick: (id: number) => void;
}) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [wrapW, setWrapW] = useState(0);

    const slides =
        items.length > 1
            ? [items[items.length - 1], ...items, items[0]]
            : [...items];
    const [index, setIndex] = useState(items.length > 1 ? 1 : 0);
    const [animate, setAnimate] = useState(true);

    const [dragging, setDragging] = useState(false);
    const [startX, setStartX] = useState<number | null>(null);
    const [deltaX, setDeltaX] = useState(0);

    useEffect(() => {
        const resize = () =>
            setWrapW(wrapRef.current?.getBoundingClientRect().width || 0);
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    const handleTransitionEnd = () => {
        if (items.length <= 1) return;
        if (index === slides.length - 1) {
            setAnimate(false);
            setIndex(1);
        } else if (index === 0) {
            setAnimate(false);
            setIndex(slides.length - 2);
        }
    };
    useEffect(() => {
        if (!animate) {
            const t = setTimeout(() => setAnimate(true), 1000);
            return () => clearTimeout(t);
        }
    }, [animate]);

    // 3초 간격 자동 스크롤 (무한 루프)
    useEffect(() => {
        if (items.length <= 1) return;
        const timer = setInterval(() => {

            if (dragging) return; // 드래그 중에는 일시 정지
            setIndex((i) => Math.min(i + 1, slides.length - 1));
        }, 3000);
        return () => clearInterval(timer);
    }, [items.length, dragging, slides.length]);

    const realItemAt = (i: number) => {
        if (items.length <= 1) return items[0];
        if (i === 0) return items[items.length - 1];
        if (i === slides.length - 1) return items[0];
        return items[i - 1];
    };

    const onPointerDown = (e: React.PointerEvent) => {
        setDragging(true);
        setStartX(e.clientX);
        setDeltaX(0);
    };
    const onPointerMove = (e: React.PointerEvent) => {
        if (!dragging || startX == null) return;
        setDeltaX(e.clientX - startX);
    };
    const finishGesture = () => {
        setDragging(false);
        setStartX(null);
        setDeltaX(0);
    };
    const onPointerUp = () => {
        if (startX == null) return;

        const SWIPE_THRESHOLD = Math.min(80, wrapW * 0.2);
        const TAP_THRESHOLD = 8;

        if (Math.abs(deltaX) < TAP_THRESHOLD) {
            const target = realItemAt(index);
            if (target) onCardClick(target.id);
            return finishGesture();
        }

        if (deltaX < -SWIPE_THRESHOLD)
            setIndex((i) => Math.min(i + 1, slides.length - 1));
        else if (deltaX > SWIPE_THRESHOLD) setIndex((i) => Math.max(i - 1, 0));

        finishGesture();
    };

    const translateX = -(index * wrapW) + deltaX;
    const trackW = slides.length * wrapW;

    return (
        <div ref={wrapRef} className="relative w-full overflow-hidden">
            <div
                className="flex select-none"
                style={{
                    width: `${trackW}px`,
                    transform: `translate3d(${translateX}px, 0, 0)`,
                    transition: animate && !dragging ? "transform 300ms ease" : "none",
                    touchAction: "pan-y",
                    cursor: dragging ? "grabbing" : "grab",
                }}
                onTransitionEnd={handleTransitionEnd}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onPointerLeave={dragging ? onPointerUp : undefined}
            >
                {slides.map((s, i) => (
                    <div
                        key={`${s?.id ?? "empty"}-${i}`}
                        style={{width: wrapW}}
                        className="px-1 shrink-0"
                    >
                        <div
                            className="relative mx-auto h-64 w-[300px] overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5">
                            <img
                                src={s?.image || "/images/sample/placeholder.jpg"}
                                alt={s?.name ?? "store"}
                                className="object-cover w-full h-full pointer-events-none"
                                draggable={false}
                            />
                            <div
                                className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"/>
                            <div className="absolute bottom-6 left-3 right-3">
                                <p className="text-sm text-white/80">
                                    {s?.district ?? "지역"} · {s?.category ?? "가게"}
                                </p>
                                <h3 className="text-lg font-semibold text-white truncate">
                                    {s?.name}
                                </h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {items.length > 0 && (
                <div className="absolute -translate-x-1/2 left-1/2 bottom-2">
                    <div className="flex gap-1.5 rounded-full bg-black/5 px-2 py-1">
                        {items.map((_, i) => {
                            const real =
                                items.length <= 1
                                    ? 1
                                    : index === 0
                                        ? items.length
                                        : index === items.length + 1
                                            ? 1
                                            : index;
                            return (
                                <span
                                    key={i}
                                    className={`h-1.5 w-1.5 rounded-full transition ${
                                        real === i + 1 ? "bg-gray-900" : "bg-gray-400/50"
                                    }`}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
