"use client";

import { useEffect, useRef } from "react";

export function RootsOverlay() {
  const leftRef = useRef<SVGSVGElement>(null);
  const rightRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const allPaths: { el: SVGPathElement; len: number; s: number; e: number }[] = [];

    const cfgLeft = [
      { idx: 0, s: 0, e: 0.82 }, { idx: 1, s: 0.02, e: 0.80 },
      { idx: 2, s: 0.07, e: 0.78 }, { idx: 3, s: 0.05, e: 0.76 },
      { idx: 4, s: 0.12, e: 0.74 }, { idx: 5, s: 0.16, e: 0.30 },
      { idx: 6, s: 0.17, e: 0.28 }, { idx: 7, s: 0.32, e: 0.46 },
      { idx: 8, s: 0.33, e: 0.44 }, { idx: 9, s: 0.48, e: 0.62 },
      { idx: 10, s: 0.49, e: 0.60 }, { idx: 11, s: 0.64, e: 0.76 },
      { idx: 12, s: 0.20, e: 0.33 }, { idx: 13, s: 0.38, e: 0.52 },
      { idx: 14, s: 0.39, e: 0.50 }, { idx: 15, s: 0.56, e: 0.68 },
      { idx: 16, s: 0.24, e: 0.36 }, { idx: 17, s: 0.42, e: 0.54 },
    ];

    const cfgRight = [
      { idx: 0, s: 0, e: 0.82 }, { idx: 1, s: 0.03, e: 0.80 },
      { idx: 2, s: 0.08, e: 0.78 }, { idx: 3, s: 0.06, e: 0.76 },
      { idx: 4, s: 0.14, e: 0.74 }, { idx: 5, s: 0.17, e: 0.31 },
      { idx: 6, s: 0.18, e: 0.29 }, { idx: 7, s: 0.33, e: 0.47 },
      { idx: 8, s: 0.34, e: 0.45 }, { idx: 9, s: 0.49, e: 0.63 },
      { idx: 10, s: 0.50, e: 0.61 }, { idx: 11, s: 0.65, e: 0.77 },
      { idx: 12, s: 0.21, e: 0.34 }, { idx: 13, s: 0.39, e: 0.53 },
      { idx: 14, s: 0.40, e: 0.51 }, { idx: 15, s: 0.57, e: 0.69 },
      { idx: 16, s: 0.25, e: 0.37 }, { idx: 17, s: 0.43, e: 0.55 },
    ];

    [
      { ref: leftRef, cfg: cfgLeft },
      { ref: rightRef, cfg: cfgRight },
    ].forEach(({ ref, cfg }) => {
      if (!ref.current) return;
      const paths = ref.current.querySelectorAll("path");
      cfg.forEach(({ idx, s, e }) => {
        const el = paths[idx] as SVGPathElement;
        if (!el) return;
        const len = el.getTotalLength();
        el.style.strokeDasharray = String(len);
        el.style.strokeDashoffset = String(len);
        allPaths.push({ el, len, s, e });
      });
    });

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const pct = maxScroll > 0 ? scrollTop / maxScroll : 0;
      allPaths.forEach(({ el, len, s, e }) => {
        const t = Math.max(0, Math.min(1, (pct - s) / (e - s)));
        el.style.strokeDashoffset = String(len * (1 - t));
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Lateral izquierdo */}
      <svg
        ref={leftRef}
        className="fixed top-0 left-0 w-[160px] h-screen pointer-events-none z-10"
        viewBox="0 0 160 520"
        preserveAspectRatio="xMinYMin slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M2 0 C8 35,-2 70,12 110 C22 145,5 185,18 225 C30 262,8 300,22 340 C34 375,12 415,20 460 C25 485,10 505,5 520" stroke="#1e3d1a" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.55"/>
        <path d="M22 0 C32 45,18 90,35 130 C48 165,30 210,44 255 C56 292,37 338,52 378 C64 410,46 452,40 520" stroke="#1e3d1a" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.38"/>
        <path d="M50 30 C60 75,44 118,62 158 C74 188,57 232,72 272 C84 305,67 350,80 390 C90 420,74 465,67 520" stroke="#1e3d1a" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.28"/>
        <path d="M10 80 C24 120,12 162,30 200 C42 230,24 268,37 308 C47 340,30 378,34 420 C37 450,22 488,16 520" stroke="#1e3d1a" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.22"/>
        <path d="M72 105 C82 142,67 182,82 220 C92 250,77 290,90 328 C100 358,84 398,92 438 C98 465,84 495,80 520" stroke="#1e3d1a" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.18"/>
        <path d="M12 110 C28 104,45 96,58 88" stroke="#1e3d1a" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.32"/>
        <path d="M12 110 C30 118,48 114,64 108" stroke="#1e3d1a" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.22"/>
        <path d="M18 225 C36 218,55 210,72 202" stroke="#1e3d1a" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.3"/>
        <path d="M18 225 C38 234,58 232,78 228" stroke="#1e3d1a" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.2"/>
        <path d="M22 340 C42 332,62 325,80 318" stroke="#1e3d1a" strokeWidth="0.85" fill="none" strokeLinecap="round" opacity="0.28"/>
        <path d="M22 340 C40 350,60 348,78 344" stroke="#1e3d1a" strokeWidth="0.65" fill="none" strokeLinecap="round" opacity="0.18"/>
        <path d="M20 460 C38 452,56 446,70 440" stroke="#1e3d1a" strokeWidth="0.75" fill="none" strokeLinecap="round" opacity="0.25"/>
        <path d="M35 130 C52 122,70 116,88 110" stroke="#1e3d1a" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.22"/>
        <path d="M44 255 C62 248,80 242,98 236" stroke="#1e3d1a" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.2"/>
        <path d="M44 255 C60 264,78 262,95 258" stroke="#1e3d1a" strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.15"/>
        <path d="M52 378 C70 370,90 364,108 358" stroke="#1e3d1a" strokeWidth="0.65" fill="none" strokeLinecap="round" opacity="0.2"/>
        <path d="M62 158 C80 150,100 143,118 137" stroke="#1e3d1a" strokeWidth="0.65" fill="none" strokeLinecap="round" opacity="0.18"/>
        <path d="M72 272 C90 264,110 258,130 252" stroke="#1e3d1a" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.16"/>
      </svg>

      {/* Lateral derecho */}
      <svg
        ref={rightRef}
        className="fixed top-0 right-0 w-[160px] h-screen pointer-events-none z-10"
        viewBox="0 0 160 520"
        preserveAspectRatio="xMaxYMin slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M158 0 C150 40,162 78,146 118 C133 152,152 192,136 232 C122 268,145 308,130 348 C118 382,140 420,132 462 C127 488,144 506,150 520" stroke="#1e3d1a" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.55"/>
        <path d="M135 0 C122 48,138 95,118 135 C103 168,122 215,106 258 C92 295,112 340,98 380 C86 412,106 455,112 520" stroke="#1e3d1a" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.38"/>
        <path d="M105 28 C93 74,112 118,93 160 C79 192,98 236,82 276 C69 310,88 354,75 394 C65 424,82 468,88 520" stroke="#1e3d1a" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.28"/>
        <path d="M148 92 C132 130,146 170,126 208 C112 240,130 278,115 318 C103 350,122 388,116 430 C112 460,128 492,136 520" stroke="#1e3d1a" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.22"/>
        <path d="M80 112 C70 150,85 190,70 230 C58 262,75 300,62 340 C50 372,68 410,60 450 C54 476,66 500,70 520" stroke="#1e3d1a" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.18"/>
        <path d="M146 118 C128 112,108 104,90 96" stroke="#1e3d1a" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.32"/>
        <path d="M146 118 C126 126,105 122,86 116" stroke="#1e3d1a" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.22"/>
        <path d="M136 232 C116 225,96 218,76 210" stroke="#1e3d1a" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.3"/>
        <path d="M136 232 C115 240,94 238,74 234" stroke="#1e3d1a" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.2"/>
        <path d="M130 348 C110 340,88 333,68 326" stroke="#1e3d1a" strokeWidth="0.85" fill="none" strokeLinecap="round" opacity="0.28"/>
        <path d="M130 348 C112 357,92 355,72 350" stroke="#1e3d1a" strokeWidth="0.65" fill="none" strokeLinecap="round" opacity="0.18"/>
        <path d="M132 462 C114 455,94 448,78 442" stroke="#1e3d1a" strokeWidth="0.75" fill="none" strokeLinecap="round" opacity="0.25"/>
        <path d="M118 135 C100 127,80 120,62 114" stroke="#1e3d1a" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.22"/>
        <path d="M106 258 C86 250,66 244,46 238" stroke="#1e3d1a" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.2"/>
        <path d="M106 258 C88 267,68 265,50 260" stroke="#1e3d1a" strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.15"/>
        <path d="M98 380 C78 372,58 365,40 358" stroke="#1e3d1a" strokeWidth="0.65" fill="none" strokeLinecap="round" opacity="0.2"/>
        <path d="M93 160 C74 152,54 145,36 139" stroke="#1e3d1a" strokeWidth="0.65" fill="none" strokeLinecap="round" opacity="0.18"/>
        <path d="M82 276 C62 268,42 262,24 256" stroke="#1e3d1a" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.16"/>
      </svg>
    </>
  );
}
