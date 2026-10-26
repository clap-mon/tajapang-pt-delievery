"use client";

import React, { useEffect, useState } from "react";

/**
 * 모바일(스마트폰) 접속 차단 가드 컴포넌트
 * - PC, 노트북, 크롬북(Chromebook - CrOS) 환경만 허용
 * - 모바일 스마트폰 환경 접속 시 전면 차단 화면 표시
 */
export default function MobileBlockGuard() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      if (typeof window === "undefined") return;

      const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";

      // 1. 크롬북(Chromebook)은 무조건 허용 (CrOS)
      if (/CrOS/i.test(ua)) {
        setIsMobile(false);
        return;
      }

      // 2. 모바일 스마트폰 User Agent 체크
      const isMobileUA = /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

      // 3. 작은 화면 폭(< 768px) + 터치 스크린 지원 환경 보조 체크
      const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;

      if (isMobileUA || (isTouchDevice && isSmallScreen)) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };

    checkDevice();

    window.addEventListener("resize", checkDevice);
    window.addEventListener("orientationchange", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
      window.removeEventListener("orientationchange", checkDevice);
    };
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-[#FFF59D] flex flex-col items-center justify-center p-4 text-center select-none">
      <div className="max-w-md w-full bg-white border-4 border-black rounded-[32px] p-6 sm:p-8 shadow-[8px_8px_0px_#000] flex flex-col items-center gap-5 animate-in zoom-in-95 duration-200">
        {/* 기기 제한 뱃지 & 아이콘 */}
        <div className="w-20 h-20 bg-rose-100 border-4 border-black rounded-2xl flex items-center justify-center text-4xl shadow-[3px_3px_0px_#000]">
          🚫📱
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 bg-amber-100 border-2 border-black rounded-full text-xs font-black text-amber-900 shadow-[2px_2px_0px_#000]">
            접속 기기 제한 안내
          </span>
          <h2 className="text-2xl font-black text-slate-900">
            모바일 접속이 제한됩니다
          </h2>
          <p className="text-sm font-bold text-slate-600 leading-relaxed pt-1.5">
            타자팡은 원활한 타자 실습과 게임 진행을 위해<br />
            <strong className="text-indigo-600 font-black">PC, 노트북, 크롬북</strong> 환경에서만<br />
            접속하실 수 있습니다.
          </p>
        </div>

        {/* 안내 상자 */}
        <div className="w-full bg-slate-50 border-2 border-black rounded-xl p-3.5 text-xs font-bold text-slate-700 leading-relaxed">
          ⌨️ 물리 키보드가 연결된 데스크톱, 노트북 또는 크롬북 기기로 다시 접속해 주세요!
        </div>
      </div>
    </div>
  );
}
