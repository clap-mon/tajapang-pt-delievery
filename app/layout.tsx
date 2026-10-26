import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taja Pang / 타자팡",
  description: "친구들과 실시간으로 즐기는 신나는 타자 배틀!",
};

import Script from "next/script";
import MobileBlockGuard from "./components/MobileBlockGuard";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <MobileBlockGuard />
        {children}
        <Script id="prevent-devtools" strategy="afterInteractive">
          {`
            // 마우스 우클릭 방지
            document.addEventListener('contextmenu', function(e) {
              e.preventDefault();
            });

            // F12 및 주요 개발자 도구 단축키 방지
            document.addEventListener('keydown', function(e) {
              if (e.key === 'F12') {
                e.preventDefault();
              }
              if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) {
                e.preventDefault();
              }
              if (e.metaKey && e.altKey && e.key === 'i') {
                e.preventDefault();
              }
              if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
              }
            });

            // 디버거 무한루프 기법 (2000ms 주기로 성능 과부하 원천 방지)
            setInterval(function() {
              (function() {
                Function("debugger")();
              })();
            }, 2000);
          `}
        </Script>
      </body>
    </html>
  );
}
