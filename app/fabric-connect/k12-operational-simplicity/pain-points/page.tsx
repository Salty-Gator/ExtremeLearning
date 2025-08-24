"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function CardSwiper() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const pointerStartXRef = useRef<number | null>(null);
  const pointerDeltaXRef = useRef<number>(0);
  const pointerActiveRef = useRef<boolean>(false);

  const slideCount = 2;

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(slideCount - 1, index));
    setCurrentIndex(clamped);
  }

  function goNext() {
    goTo(currentIndex + 1);
  }

  function goPrev() {
    goTo(currentIndex - 1);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentIndex]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    pointerActiveRef.current = true;
    pointerStartXRef.current = e.clientX;
    pointerDeltaXRef.current = 0;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointerActiveRef.current || pointerStartXRef.current === null) return;
    const deltaX = e.clientX - pointerStartXRef.current;
    pointerDeltaXRef.current = deltaX;
    if (trackRef.current) {
      const percentage = (deltaX / e.currentTarget.clientWidth) * 100;
      const base = currentIndex * -100;
      trackRef.current.style.transform = `translateX(${base + percentage}%)`;
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointerActiveRef.current) return;
    pointerActiveRef.current = false;
    const thresholdPx = 50;
    const deltaX = pointerDeltaXRef.current;
    if (Math.abs(deltaX) > thresholdPx) {
      if (deltaX < 0) goNext(); else goPrev();
    }
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
    pointerStartXRef.current = null;
    pointerDeltaXRef.current = 0;
  }

  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
  }, [currentIndex]);

  return (
    <div className="rounded-large bg-transparent">

      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="K-12 cards"
        aria-live="polite"
        className="overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          ref={trackRef}
          className="flex w-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          <div className="w-full shrink-0 px-4 pb-4">
            <div className="rounded-large border border-default-200 bg-content1 p-4">
              <h3 className="text-base font-semibold text-purple-500">Typical school system architecture</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-2">
                <li>District data center/core with firewalls, content filter, and Internet.</li>
                <li>WAN links to each school; school distribution uplinks to access closets.</li>
                <li>Access layer PoE switches powering APs, AV, phones, cameras, and printers.</li>
                <li>Wireless SSIDs for Students, Staff, Guests, and Devices/IoT with appropriate auth.</li>
                <li>Core services: DHCP/DNS, RADIUS/IdP, NAC/onboarding, logging, and monitoring.</li>
              </ul>
            </div>
          </div>

          <div className="w-full shrink-0 px-4 pb-4">
            <div className="rounded-large border border-default-200 bg-content1 p-4">
              <h3 className="text-base font-semibold text-purple-500">Common operational pain points</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-2">
                <li>Onboarding complexity for diverse devices (laptops, AV/IoT, guests).</li>
                <li>Bonjour/mDNS and casting across segments for projectors and ClearTouch screens.</li>
                <li>VLAN/ACL sprawl and inconsistent policy between schools.</li>
                <li>PoE budgeting, AP density planning, and RF troubleshooting.</li>
                <li>Limited IT staff leading to slower troubleshooting and coordination.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 px-4 pb-4">
        {Array.from({ length: slideCount }).map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Go to slide ${idx + 1}`}
            aria-current={idx === currentIndex ? "true" : undefined}
            onClick={() => goTo(idx)}
            className={
              idx === currentIndex
                ? "h-2 w-2 rounded-full bg-primary"
                : "h-2 w-2 rounded-full bg-default-300 hover:bg-default-400"
            }
          />
        ))}
      </div>
    </div>
  );
}

export default function K12PainPointsPage() {
  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-2 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            <span className="text-purple-500">K‑12</span> Network Deep Dive & Pain Points
          </h1>
          <p className="mt-4 text-base sm:text-lg text-default-600">
            Typical school system architecture and the operational challenges IT teams face day‑to‑day.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
          className="mt-8 grid grid-cols-1 gap-4"
        >
          <CardSwiper />

          <div className="rounded-large border border-default-200 bg-content1 p-4">
            <h2 className="text-lg font-semibold text-purple-500">How Extreme Fabric Connect helps</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-2">
              <li>Service‑based networking: define services once; deploy consistently district‑wide.</li>
              <li>End‑to‑end segmentation: isolate Students, Staff, Guests, and IoT without complex ACL webs.</li>
              <li>Deterministic paths and fast convergence: minimize downtime and simplify root cause analysis.</li>
              <li>Scoped service gateways: enable AirPlay/Chromecast and printing across segments securely.</li>
              <li>Operational simplicity: fewer constructs to manage, safer changes, faster rollouts.</li>
              <li>Scales from single school to district with consistent policy and reduced toil.</li>
            </ul>
          </div>

          <ImageSwiper />
        </motion.div>
      </div>
    </section>
  );
}

function ImageSwiper() {
  const [images, setImages] = useState<{ filename: string; url: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const pointerStartXRef = useRef<number | null>(null);
  const pointerDeltaXRef = useRef<number>(0);
  const pointerActiveRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/images/fabric-swiper")
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        const imgs = Array.isArray(data?.images) ? data.images : [];
        setImages(imgs);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  function goTo(index: number) {
    if (images.length === 0) return;
    const clamped = Math.max(0, Math.min(images.length - 1, index));
    setCurrentIndex(clamped);
  }

  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
  }, [currentIndex]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (images.length === 0) return;
    pointerActiveRef.current = true;
    pointerStartXRef.current = e.clientX;
    pointerDeltaXRef.current = 0;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointerActiveRef.current || pointerStartXRef.current === null || !trackRef.current) return;
    const deltaX = e.clientX - pointerStartXRef.current;
    pointerDeltaXRef.current = deltaX;
    const percentage = (deltaX / e.currentTarget.clientWidth) * 100;
    const base = currentIndex * -100;
    trackRef.current.style.transform = `translateX(${base + percentage}%)`;
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointerActiveRef.current) return;
    pointerActiveRef.current = false;
    const thresholdPx = 50;
    const deltaX = pointerDeltaXRef.current;
    if (Math.abs(deltaX) > thresholdPx) {
      if (deltaX < 0) goTo(currentIndex + 1); else goTo(currentIndex - 1);
    } else {
      goTo(currentIndex);
    }
    pointerStartXRef.current = null;
    pointerDeltaXRef.current = 0;
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-large bg-transparent">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Fabric Connect images"
        aria-live="polite"
        className="overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          ref={trackRef}
          className="flex w-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((img) => (
            <div key={img.url} className="w-full shrink-0 px-0 pb-2">
              <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                <img src={img.url} alt={img.filename} className="absolute inset-0 h-full w-full object-contain rounded-large" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 px-2 pt-2">
        {images.map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Go to slide ${idx + 1}`}
            aria-current={idx === currentIndex ? "true" : undefined}
            onClick={() => goTo(idx)}
            className={
              idx === currentIndex
                ? "h-2 w-2 rounded-full bg-primary"
                : "h-2 w-2 rounded-full bg-default-300 hover:bg-default-400"
            }
          />
        ))}
      </div>
    </div>
  );
}


