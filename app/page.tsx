"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TajaPangLogo from './components/TajaPangLogo';
import { appAlert } from '@/lib/appDialog';

// 교실 현장 욕설/비속어 방어용 금칙어 사전 (40여종)
const BAD_WORDS = [
  '개새끼', '개세끼', '개색기', '씨발', '시발', '씹알', '십알', '엠창', '엄창', '느금마',
  '지랄', '병신', '빙신', '호로', '존나', '좃나', '새끼', '세끼', '뒈져', '뒤져',
  '또라이', '미친놈', '미친년', '썅', '샹', '아가리', '새키', '세키', '씨바', '시바',
  '닥쳐', '대가리', '머가리', '꺼져', '빡대가리', '썅년', '썅놈', '새끼야', '호로새끼', '존나게'
];

export default function Home() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'landing' | 'join'>('landing'); // 랜딩 뷰와 방 입장 폼 뷰 분리
  const [showGuide, setShowGuide] = useState(false); // 사용 안내 모달 팝업 상태
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [loading, setLoading] = useState(false);

  // 대기실 페이지(/room/[code]) 템플릿 번들을 미리 백그라운드 캐싱 및 자동 로그인 파싱
  useEffect(() => {
    setLoading(false); // 컴포넌트 마운트 시 로딩 상태 초기화
    router.prefetch('/room/[code]');

    // URL 파라미터를 파싱하여 자동 로그인 처리
    const urlParams = new URLSearchParams(window.location.search);
    const paramCode = urlParams.get('code');
    const paramNickname = urlParams.get('nickname');
    const paramView = urlParams.get('view');

    if (paramView === 'join') {
      setViewMode('join');
    }

    if (paramCode && paramNickname) {
      setLoading(true);
      sessionStorage.setItem('tajapang_nickname', paramNickname);
      sessionStorage.setItem('tajapang_is_teacher', 'false');
      router.push(`/room/${paramCode}`);
    } else if (paramCode) {
      setViewMode('join');
      setRoomCode(paramCode);
    }
  }, [router]);

  // 닉네임 유효성 실시간 검증 도우미
  const validateNickname = (val: string): string => {
    if (!val) return '이름을 입력해 주세요.';
    if (val.length < 2 || val.length > 6) return '닉네임은 2자 이상 6자 이하여야 합니다.';

    if (val.trim() === '선생님') {
      return "'선생님'은 학생 닉네임으로 사용할 수 없습니다.";
    }

    // 완성형 한글, 영문, 숫자 조합만 허용 (자음/모음 초성 차단)
    const regex = /^[가-힣a-zA-Z0-9]+$/;
    if (!regex.test(val)) {
      return '완성된 한글, 영문, 숫자만 가능합니다. (초성/특수문자/공백 금지)';
    }

    // 비속어 차단 체크
    const hasBadWord = BAD_WORDS.some(word => val.includes(word));
    if (hasBadWord) {
      return '욕설이나 비속어는 닉네임으로 사용할 수 없습니다.';
    }

    return '';
  };

  // 닉네임 상태 변화 핸들러
  const handleNicknameChange = (val: string) => {
    setNickname(val);
    if (val === '') {
      setNicknameError('');
    } else {
      setNicknameError(validateNickname(val));
    }
  };

  // 방 입장 로직 (학생용)
  const handleJoin = async () => {
    // 닉네임 최종 이중 보안 가드
    const err = validateNickname(nickname);
    if (err) {
      appAlert(err);
      return;
    }
    if (!roomCode || !nickname) {
      appAlert('방 코드와 닉네임을 모두 입력해주세요!');
      return;
    }

    setLoading(true);
    sessionStorage.setItem('tajapang_nickname', nickname.trim());
    sessionStorage.setItem('tajapang_is_teacher', 'false');
    router.push(`/room/${roomCode.trim()}`);
  };

  // 새 방 만들기 (선생님용)
  const handleCreateRoom = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    sessionStorage.setItem('tajapang_nickname', '선생님');
    sessionStorage.setItem('tajapang_is_teacher', 'true');
    router.push(`/room/${newCode}`);
  };

  // 학생 개인연습모드 시작
  const handlePracticeMode = () => {
    const practiceNickname = nickname.trim() || '나';
    sessionStorage.setItem('tajapang_nickname', practiceNickname);
    router.push('/practice');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF9F5] p-4 relative overflow-hidden">
      {/* 귀여운 장식용 파스텔톤 배경 도형들 */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-[#FFCCD5]/40 rounded-full blur-xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-[#D8F3DC]/40 rounded-full blur-xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-28 h-28 bg-[#D8E2DC]/40 rounded-full blur-xl pointer-events-none" />

      {/* 메인 랜딩 뷰 */}
      {viewMode === 'landing' && (
        <div className="card-container !p-6 md:!p-7 max-w-[500px] w-full text-center flex flex-col items-center gap-4">
          {/* 일러스트 액자 영역 */}
          <div className="w-full aspect-square rounded-2xl border-4 border-black shadow-[4px_4px_0px_#000] overflow-hidden bg-[#FAF9F5] relative">
            <img
              src="/tajapang_s1_thumbnail.webp"
              alt="Taja Pang Season 1"
              className="w-full h-full object-cover select-none"
            />
          </div>

          {/* 타이틀 영역 */}
          <div className="bg-[#E8F1F2] border-4 border-black px-5 py-2.5 rounded-2xl shadow-[4px_4px_0px_#000] inline-block w-full">
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center justify-center gap-1.5">
              <span>타자팡</span>
              <span className="text-indigo-600 font-extrabold text-lg md:text-xl border-l-2 border-slate-400 pl-2">국어 Season 1</span>
            </h1>
          </div>

          <p className="text-slate-500 font-extrabold text-xs -mt-2">
            친구들과 함께 달리는 실시간 우리말 레이싱!
          </p>

          {/* 버튼 리스트 */}
          <div className="w-full max-w-[360px] flex flex-col gap-3.5 mt-2">
            <button
              onClick={() => setViewMode('join')}
              className="w-full bg-[#D8F3DC] text-slate-800 border-4 border-black px-6 py-3.5 rounded-2xl font-black text-lg transition-all shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] active:scale-95 cursor-pointer text-center"
            >
              시작하기! 🚀
            </button>
            <button
              onClick={() => setShowGuide(true)}
              className="w-full bg-[#FFE5EC] text-slate-800 border-4 border-black px-6 py-3 rounded-2xl font-black text-base transition-all shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] active:scale-95 cursor-pointer text-center"
            >
              사용 안내 📖
            </button>
          </div>
        </div>
      )}

      {/* 방 입장 및 생성 폼 뷰 */}
      {viewMode === 'join' && (
        <div className="card-container !p-6 md:!p-8 max-w-[420px] w-full flex flex-col">
          {/* 뒤로가기 버튼 */}
          <button
            onClick={() => setViewMode('landing')}
            className="flex items-center justify-center gap-1 self-start bg-slate-100 border-2 border-black px-3.5 py-1 rounded-full font-black text-xs shadow-[2px_2px_0px_#000] mb-5 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] active:scale-95 cursor-pointer transition-all"
          >
            ← 이전으로
          </button>

          {/* 로고 섹션 */}
          <div className="mb-5 text-center">
            <div className="flex justify-center mb-1">
              <TajaPangLogo size="lg" />
            </div>
            <p className="text-slate-600 font-extrabold text-xs mt-1">친구들과 함께 달리는 실시간 우리말 레이싱</p>
          </div>

          {/* 참여 폼 섹션 */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5 w-full">
              <div className="flex items-center gap-2">
                <label className="w-[110px] text-sm font-black text-slate-800 text-left flex-shrink-0">방 코드 (6자리)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="000000"
                  className="flex-grow min-w-0 px-3 py-2 rounded-xl border-4 border-black text-base outline-none transition-all focus:bg-indigo-50/50 shadow-[2px_2px_0px_#000] text-center font-black"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <div className="flex items-center gap-2">
                <label className="w-[110px] text-sm font-black text-slate-800 text-left flex-shrink-0">닉네임</label>
                <input
                  type="text"
                  placeholder="이름을 입력하세요"
                  className={`flex-grow min-w-0 px-3 py-2 rounded-xl border-4 text-base outline-none transition-all focus:bg-indigo-50/50 shadow-[2px_2px_0px_#000] text-center font-black ${nicknameError ? 'border-rose-500 focus:border-rose-500' : 'border-black'}`}
                  value={nickname}
                  onChange={(e) => handleNicknameChange(e.target.value)}
                />
              </div>
              {nicknameError && (
                <div className="text-[10px] font-black text-rose-500 bg-rose-50 border-2 border-rose-500 px-3 py-1.5 rounded-xl shadow-[1.5px_1.5px_0px_#f43f5e] text-center animate-pulse self-end w-[calc(100%-118px)]">
                  {nicknameError}
                </div>
              )}
            </div>

            <button
              onClick={handleJoin}
              disabled={loading}
              className={`btn-primary mt-2 text-base py-3 w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? '접속 중...' : '게임 참여하기!'}
            </button>

            <button
              onClick={handlePracticeMode}
              disabled={loading}
              className={`flex items-center justify-center gap-2 bg-[#E8F1F2] text-slate-800 border-4 border-black px-6 py-3 rounded-full font-black text-base transition-all shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] active:scale-95 cursor-pointer mt-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              🎯 개인연습모드 시작하기
            </button>

            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className={`flex items-center justify-center gap-2 bg-white text-slate-800 border-4 border-black px-6 py-3 rounded-full font-black text-base transition-all shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] active:scale-95 cursor-pointer mt-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-5 h-5 text-slate-800 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"></path>
              </svg>
              <span>선생님(방장) 모드 시작하기</span>
            </button>
          </div>
        </div>
      )}

      {/* 초특급 레트로 로딩 오버레이 모달 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF9F5]/85 backdrop-blur-md p-6 animate-in fade-in duration-200">
          <style>{`
            @keyframes barFlow {
              0% { background-position: 0 0; }
              100% { background-position: 40px 0; }
            }
            .animate-bar-flow {
              background-image: repeating-linear-gradient(
                45deg,
                #4F46E5,
                #4F46E5 10px,
                #4338CA 10px,
                #4338CA 20px
              );
              background-size: 40px 40px;
              animation: barFlow 1s linear infinite;
            }
          `}</style>
          <div className="card-container max-w-[340px] w-full text-center flex flex-col items-center gap-5 p-8 border-4 border-black shadow-[6px_6px_0px_#000] bg-white rounded-3xl animate-in zoom-in-95 duration-200">
            {/* 픽셀 미니카 통통 튀는 애니메이션 */}
            <div className="relative w-28 h-16 flex items-center justify-center">
              <div className="text-5xl animate-bounce duration-500">🏎️</div>
              <div className="absolute bottom-0 w-16 h-1.5 bg-black/10 rounded-full blur-xs animate-pulse"></div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900 flex items-center justify-center gap-1.5 animate-pulse">
                🚦 {!nickname ? '대기방 만드는 중...' : '방에 입장하는 중...'}
              </h3>
              <p className="text-[11px] text-slate-500 font-extrabold leading-relaxed">
                실시간 타자 레이싱 서버와 동기화 중입니다.<br />잠시만 기다려 주세요!
              </p>
            </div>

            {/* 도트 스타일 무빙 프로그레스 바 */}
            <div className="w-full h-5 bg-slate-100 border-3 border-black rounded-full overflow-hidden relative shadow-[inset_1.5px_1.5px_0px_rgba(0,0,0,0.15)]">
              <div className="h-full border-r-3 border-black animate-bar-flow" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* 사용 안내 모달 팝업 */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="max-w-[620px] w-full bg-[#FAF9F6] border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_#000] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            {/* 헤더 */}
            <div className="flex justify-between items-center border-b-4 border-black pb-2 mb-1">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-1.5">
                <span>📖 타자팡 상세 사용 설명서</span>
              </h2>
              <button
                onClick={() => setShowGuide(false)}
                className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center bg-[#FFE5EC] font-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 내용 */}
            <div className="text-slate-700 text-sm font-extrabold flex flex-col gap-4 max-h-[440px] overflow-y-auto pr-1">
              <div className="bg-[#E8F1F2] border-2 border-black rounded-2xl p-3.5 shadow-[2px_2px_0px_#000]">
                <p className="text-indigo-800 font-black text-sm mb-1.5">🎮 타자팡 소개</p>
                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                  타자팡은 친구들과 실시간으로 방에 모여 초등 국어 필수 어휘(속담, 관용구, 사자성어, 고유어)를 타이핑하며 순위를 겨루는 실시간 국어 어휘 레이싱 게임입니다.
                </p>
              </div>

              {/* 1. 대기실 가이드 */}
              <div className="bg-[#D8F3DC]/60 border-2 border-black rounded-2xl p-3.5 shadow-[2px_2px_0px_#000]">
                <p className="text-[#2D6A4F] font-black text-sm mb-2">🏫 1. 대기실 & 설정 활용법</p>
                <div className="flex flex-col gap-2.5">
                  <div>
                    <span className="text-xs font-black text-[#1B4332] block">🤖 타자로봇(AI 봇) 추가 기능</span>
                    <span className="text-[11px] text-slate-600 font-bold leading-relaxed block mt-0.5">
                      혼자 연습하거나 참여 학생이 적을 때 대기실에서 난이도별 봇(초급 🐢, 중급 🐇, 고급 🐆)을 추가하여 박진감 넘치는 멀티플레이 레이싱을 채울 수 있습니다.
                    </span>
                  </div>
                  <div className="border-t border-black/10 pt-2">
                    <span className="text-xs font-black text-[#1B4332] block">⚙️ 게임 환경 설정 옵션 안내</span>
                    <div className="text-[11px] text-slate-600 font-bold flex flex-col gap-1.5 mt-1 leading-relaxed">
                      <div className="flex items-start gap-1.5">
                        <span className="shrink-0 select-none">•</span>
                        <span><strong>띄어쓰기 가이드 표시:</strong> 문장 공백 자리에 빈칸 표시용 기호를 시각적으로 보여주어 올바른 띄어쓰기 타자를 유도합니다.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="shrink-0 select-none">•</span>
                        <span><strong>무결점(Flawless) 보너스 활성화:</strong> 오타나 지움(Backspace) 없이 한 번에 문장을 정밀하게 타이핑했을 때 보너스 점수 가중치를 부여합니다.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="shrink-0 select-none">•</span>
                        <span><strong>실시간 트랙 가리기:</strong> 대화면 TV에 송출되는 랭킹 주행 트랙을 가려, 학생들이 화면 대신 본인의 칠판 타자에 집중하도록 유도하는 블라인드 모드입니다.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. 꾸러미 가이드 */}
              <div className="bg-[#FFF3B0]/60 border-2 border-black rounded-2xl p-3.5 shadow-[2px_2px_0px_#000]">
                <p className="text-[#B27D12] font-black text-sm mb-2">👑 2. 학습 꾸러미 및 모드 설명</p>
                <div className="flex flex-col gap-2.5">
                  <div>
                    <span className="text-xs font-black text-[#855D07] block">📚 타자 꾸러미 테마</span>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 font-bold flex flex-col gap-1 mt-1 leading-relaxed">
                      <li><strong>5학년 국어:</strong> 5학년 1학기 국어 내용과 관련된 낱말 및 문장 세트입니다.</li>
                      <li className="list-none pl-2.5 text-[9.5px] text-slate-800 font-semibold mt-1 mb-2.5 flex flex-col gap-1 leading-normal">
                        <span className="font-black text-[10px] text-slate-900 mb-0.5">[5학년 1학기 단원별 관련 성취기준]</span>

                        <span>• 1단원(대화를 나누어요)</span>
                        <span className="pl-2.5 text-slate-700 font-medium">- [6국01-03] 주제와 관련하여 궁금한 내용을 질문하며 적극적으로 듣고 말한다.</span>
                        <span className="pl-2.5 text-slate-700 font-medium">- [6국01-01] 대화에서 생략된 내용을 추론하며 듣는다.</span>

                        <span>• 2단원(체험한 일을 글로 써요)</span>
                        <span className="pl-2.5 text-slate-700 font-medium">- [6국04-05] 글과 담화에 쓰인 시간 표현을 이해하고 상황에 맞게 표현한다.</span>
                        <span className="pl-2.5 text-slate-700 font-medium">- [6국03-03] 체험한 일에 대한 감상을 나타내는 글을 쓴다.</span>

                        <span>• 3단원(발표하고 질문해요)</span>
                        <span className="pl-2.5 text-slate-700 font-medium">- [6국01-03] 주제와 관련하여 궁금한 내용을 질문하며 적극적으로 듣고 말한다.</span>
                        <span className="pl-2.5 text-slate-700 font-medium">- [6국01-05] 자료를 선별하여 핵심 정보를 중심으로 내용을 구성하고 매체를 활용하여 발표한다.</span>
                        <span className="pl-2.5 text-slate-700 font-medium">- [6국06-01] 정보 검색 도구를 활용하여 자신의 목적에 맞는 매체 자료를 찾는다.</span>

                        <span>• 매체단원(필요한 정보를 찾아요)</span>
                        <span className="pl-2.5 text-slate-700 font-medium">- [6국06-01] 정보 검색 도구를 활용하여 자신의 목적에 맞는 매체 자료를 찾는다.</span>
                        <span className="pl-2.5 text-slate-700 font-medium">- [6국03-02] 적절한 근거를 사용하고 인용의 출처를 밝히며 주장하는 글을 쓴다.</span>

                        <span>• 4단원(대상을 설명해요)</span>
                        <span className="pl-2.5 text-slate-700 font-medium">- [6국02-01] 글의 구조를 고려하며 주제나 주장을 파악하고 글 내용을 요약한다.</span>
                        <span className="pl-2.5 text-slate-700 font-medium">- [6국03-01] 알맞은 내용을 선정하여 대상의 특성이 나타나게 설명하는 글을 쓴다.</span>

                        <span>• 5단원(의논하며 토의해요)</span>
                        <span className="pl-2.5 text-slate-700 font-medium">- [6국02-04] 문제 상황과 관련된 다양한 관점의 글을 읽고 이를 문제 해결에 활용한다.</span>
                        <span className="pl-2.5 text-slate-700 font-medium">- [6국01-06] 토의에 협력적으로 참여하며 서로의 의견을 비교하고 조정한다.</span>

                        <span>• 6단원(작품을 즐겨요)</span>
                        <span className="pl-2.5 text-slate-700 font-medium">- [6국05-02] 비유적 표현의 효과에 유의하여 작품을 감상한다.</span>
                        <span className="pl-2.5 text-slate-700 font-medium">- [6국05-04] 인상적인 부분을 중심으로 작품에 대한 의견을 나눈다.</span>
                      </li>
                      <li><strong>관용표현과 순우리말 고유어:</strong> 조상들의 지혜가 담긴 관용어구 및 우리말 고유 어휘를 학습합니다.</li>
                      <li className="list-none pl-2.5 text-[9.5px] text-slate-800 font-semibold mt-1 mb-2.5 flex flex-col gap-1 leading-normal">
                        <span className="pl-2.5 text-slate-700 font-medium">- [6국04-03] 관용 표현의 특징을 이해하고 상황에 맞게 쓴다.</span>
                        <span className="pl-2.5 text-slate-700 font-medium">- [6국04-01] 낱말이 상황에 따라 다양하게 쓰임을 이해하고 어휘를 올바르게 사용한다.</span>
                      </li>
                    </ul>
                    <p className="text-[10px] text-slate-500 font-bold mt-2 pl-1.5">
                      ※ 핵심 어휘를 바탕으로 생성한 교육적이고 유용한 타자 연습용 문장입니다.
                    </p>
                  </div>

                  <div className="border-t border-black/10 pt-2">
                    <span className="text-xs font-black text-[#855D07] block">✍️ 직접 입력하기 (선생님 지정 단어)</span>
                    <span className="text-[11px] text-slate-600 font-bold leading-relaxed block mt-0.5">
                      선생님이 오늘 수업에 필요한 핵심 단어나 요약 문장을 직접 입력하여 학생들에게 출제할 수 있습니다.<br />
                      <strong>[사용방법]</strong><br />
                      1) '직접 입력하기' 꾸러미 선택<br />
                      2) 텍스트 입력 칸에 문장들을 한 줄(엔터 구분)에 하나씩 작성<br />
                      3) 시작하기 터치!
                    </span>
                  </div>

                  <div className="border-t border-black/10 pt-2">
                    <span className="text-xs font-black text-[#855D07] block">🎯 문장/낱말 모드 및 문제 수 설정</span>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 font-bold flex flex-col gap-1 mt-1 leading-relaxed">
                      <li><strong>문장 모드:</strong> 호응 구조와 완성된 문맥을 익히는 긴 형태의 타속 연습입니다.</li>
                      <li><strong>낱말 모드:</strong> 단어 단위로 빠르고 경쾌하게 스펠링과 어휘를 훈련합니다.</li>
                      <li><strong>학습 문제 수 조절:</strong> 출제할 문장/단어의 갯수(5개~15개)를 제한하여 수업 진행 시간에 맞춰 난이도를 제어할 수 있습니다.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 버튼 */}
            <button
              onClick={() => setShowGuide(false)}
              className="w-full bg-[#E8F1F2] text-slate-800 border-4 border-black py-3 rounded-2xl font-black text-sm shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] active:scale-95 cursor-pointer"
            >
              확인했어요!
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
