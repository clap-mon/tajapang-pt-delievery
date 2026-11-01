"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import TajaPangLogo from '../components/TajaPangLogo';
import { appAlert, appConfirm } from '@/lib/appDialog';

const ContentSelector = dynamic(() => import('../room/[code]/components/ContentSelector'), {
  ssr: false,
  loading: () => <div className="text-center font-black text-slate-500 py-10">꾸러미 선택기를 불러오는 중...</div>
});

interface Participant {
  id: string;
  nickname: string;
  emoji: string;
  joinedAt: number;
  isReady: boolean;
  isBot?: boolean;
  botLevel?: 'easy' | 'medium' | 'hard';
  score?: number;
  progress?: number;
  completedAt?: number;
  accuracy?: number;
}

export default function PracticeLobby() {
  const router = useRouter();

  const [nickname, setNickname] = useState('나');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [botSpeeds, setBotSpeeds] = useState({ easy: 150, medium: 300, hard: 500 });
  const [comboWeight, setComboWeight] = useState(50);
  const [enableFlawlessBonus, setEnableFlawlessBonus] = useState(true);
  const [showSpace, setShowSpace] = useState(false);
  const [removePunctuation, setRemovePunctuation] = useState(false);
  const [hideStudentTrack, setHideStudentTrack] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedNickname = sessionStorage.getItem('tajapang_nickname') || '나';
    setNickname(storedNickname);

    // 본인(나)을 참가자 목록에 기본 등록
    const EMOJIS = [
      '🐶', '🐱', '🦁', '🐯', '🦊', '🐻', '🐼', '🐨', '🐰', '🐹',
      '🐭', '🐸', '🐷', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅'
    ];
    let myEmoji = sessionStorage.getItem('tajapang_emoji');
    if (!myEmoji) {
      myEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      sessionStorage.setItem('tajapang_emoji', myEmoji);
    }

    setParticipants([
      {
        id: 'me',
        nickname: storedNickname,
        emoji: myEmoji,
        joinedAt: Date.now(),
        isReady: true,
        progress: 0,
        score: 0,
        accuracy: 100
      }
    ]);
  }, []);

  const handleAddBot = (level: 'easy' | 'medium' | 'hard') => {
    const currentBots = participants.filter(p => p.isBot);
    if (currentBots.length >= 3) {
      appAlert('AI 타자로봇은 최대 3개까지만 영입할 수 있습니다.');
      return;
    }

    const botId = `bot_${Math.random().toString(36).substring(2, 7)}`;
    const botNames = {
      easy: '초급봇',
      medium: '중급봇',
      hard: '고급봇'
    };

    const levelCount = currentBots.filter(p => p.botLevel === level).length;
    const botNickname = `${botNames[level]} ${levelCount + 1}`;

    const botData: Participant = {
      id: botId,
      nickname: botNickname,
      emoji: level === 'easy' ? '🐢' : level === 'medium' ? '🐇' : '🐆',
      joinedAt: Date.now(),
      isReady: true,
      isBot: true,
      botLevel: level,
      progress: 0,
      score: 0,
      accuracy: 100
    };

    setParticipants(prev => [...prev, botData]);
  };

  const removeParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const updateBotSpeed = (level: 'easy' | 'medium' | 'hard', speed: number) => {
    const limits = {
      easy: { min: 0, max: 200 },
      medium: { min: 201, max: 400 },
      hard: { min: 401, max: 800 }
    };

    const { min, max } = limits[level];
    const validatedSpeed = Math.min(max, Math.max(min, speed));

    setBotSpeeds(prev => ({
      ...prev,
      [level]: validatedSpeed
    }));
  };

  // ContentSelector에서 시작 버튼 클릭 시 콜백
  const handleStartPractice = (problemSet: string[], contentOption: 'sentence' | 'word') => {
    const settings = {
      botSpeeds,
      comboWeight,
      enableFlawlessBonus,
      showSpace,
      removePunctuation,
      hideStudentTrack,
      contentOption
    };

    // sessionStorage에 데이터 전달
    sessionStorage.setItem('tajapang_practice_problemSet', JSON.stringify(problemSet));
    sessionStorage.setItem('tajapang_practice_settings', JSON.stringify(settings));
    sessionStorage.setItem('tajapang_practice_participants', JSON.stringify(participants));

    router.push('/practice/play');
  };

  const botList = participants.filter(p => p.isBot);

  return (
    <main className="min-h-screen bg-[#FFF59D] p-3 md:p-4 flex flex-col justify-center">
      <div className="max-w-6xl mx-auto space-y-3.5 w-full">
        {/* 헤더 섹션 */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-[28px] border-4 border-black shadow-[8px_8px_0px_#000] animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full flex-1 justify-between">
            <div className="flex flex-col items-center sm:items-start">
              <TajaPangLogo size="md" />
              {/* 로고 아래 개인연습모드 표시 요구사항 반영 */}
              <span className="mt-1 bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 border-black shadow-[1.5px_1.5px_0px_#000] animate-pulse">
                🎯 개인연습모드
              </span>
            </div>

            {/* 접속 방 코드 영역 대체 */}
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4 w-full sm:border-x-4 sm:border-black sm:mx-6 sm:px-6 py-0.5">
              <div className="text-center sm:text-left">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-0.5 leading-none">연습 모드</h2>
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <span className="text-2xl md:text-4xl font-black text-indigo-600 tracking-wider drop-shadow-[2px_2px_0px_#000] leading-none">
                    개인 연습방
                  </span>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (await appConfirm('개인연습을 종료하고 메인 화면으로 돌아가시겠습니까?')) {
                    setLoading(true);
                    router.push('/?view=join');
                  }
                }}
                className="bg-rose-500 text-white text-sm px-6 py-2.5 rounded-xl border-4 border-black hover:bg-rose-600 hover:-translate-y-0.5 transition-all font-black cursor-pointer shadow-[3px_3px_0px_#000] active:translate-y-0 active:shadow-[1px_1px_0px_#000]"
              >
                🚪 나가기
              </button>
            </div>
          </div>

          {/* 참가 로봇 수 */}
          <div className="text-center md:text-right bg-[#00F0FF] px-8 py-3 rounded-[20px] border-4 border-black shadow-[4px_4px_0px_#000] min-w-[150px]">
            <p className="text-slate-900 font-black text-sm uppercase tracking-widest mb-1.5">영입한 로봇</p>
            <p className="text-3xl font-black text-slate-900 leading-none">
              {botList.length} <span className="text-sm font-bold text-slate-800">/ 3</span>
            </p>
          </div>
        </div>

        {/* 참가자 그리드 */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 bg-white/70 p-4 rounded-[28px] border-4 border-black shadow-[6px_6px_0px_#000]">
          {participants.map((p) => (
            <div key={p.id} className="flex flex-col items-center animate-in fade-in zoom-in duration-300 group relative">
              {p.isBot && (
                <button
                  onClick={() => removeParticipant(p.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white border-2 border-black rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md font-black cursor-pointer hover:bg-black"
                >
                  ✕
                </button>
              )}
              <div className={`w-12 h-12 rounded-xl border-4 flex items-center justify-center text-2xl shadow-[2.5px_2.5px_0px_#000] mb-1.5 transition-transform hover:scale-105 ${p.isBot ? 'bg-slate-900 border-black animate-pulse-subtle' : 'bg-white border-black'
                }`}>
                {p.emoji}
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border-2 border-black shadow-[1.5px_1.5px_0px_#000] truncate max-w-full ${!p.isBot ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-white'
                }`}>
                {p.nickname}
              </span>
            </div>
          ))}
          {Array.from({ length: Math.max(0, 10 - participants.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="flex flex-col items-center opacity-20">
              <div className="w-12 h-12 bg-slate-100 rounded-xl border-4 border-dashed border-slate-400 flex items-center justify-center text-lg font-bold mb-1.5">
                ?
              </div>
            </div>
          ))}
        </div>

        {/* 설정 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* AI 로봇 설정 */}
          <div className="bg-white p-4 md:p-5 rounded-[28px] border-4 border-black shadow-[8px_8px_0px_#000] flex flex-col h-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-indigo-600 border-2 border-black rounded-xl flex items-center justify-center text-lg shadow-[2px_2px_0px_#000]">🤖</div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">AI 타자 로봇 설정</h3>
                <p className="text-[9px] font-black text-slate-500">로봇은 최대 3개까지 영입하여 경쟁할 수 있습니다.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['easy', 'medium', 'hard'] as const).map((lv) => (
                <div key={lv} className={`p-2.5 rounded-xl border-4 border-black flex flex-col gap-2.5 transition-all hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0px_#000] ${lv === 'easy' ? 'bg-[#00FF66]/20' :
                  lv === 'medium' ? 'bg-[#FFF59D]/35' : 'bg-[#FF007F]/20'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-lg">{lv === 'easy' ? '🐢' : lv === 'medium' ? '🐇' : '🐆'}</span>
                      <span className="text-xs font-black text-slate-800">
                        {lv === 'easy' ? '초급' : lv === 'medium' ? '중급' : '고급'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddBot(lv)}
                      className="bg-white border-2 border-black px-2 py-0.5 rounded-lg text-[8px] font-black shadow-[1.5px_1.5px_0px_#000] hover:bg-slate-100 active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] cursor-pointer text-slate-900"
                    >
                      영입 +
                    </button>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1.5 rounded-lg border-2 border-black shadow-inner">
                    <input
                      type="number"
                      min={lv === 'easy' ? 0 : lv === 'medium' ? 201 : 401}
                      max={lv === 'easy' ? 200 : lv === 'medium' ? 400 : 800}
                      value={botSpeeds[lv]}
                      onChange={(e) => updateBotSpeed(lv, parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent text-center font-black text-[10px] text-slate-900 outline-none"
                    />
                    <span className="text-[8px] font-black text-slate-400 pr-0.5 uppercase tracking-tighter">타</span>
                  </div>
                  <div className="flex justify-center">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border border-black bg-white shadow-[1px_1px_0px_#000] ${lv === 'easy' ? 'text-emerald-700' :
                      lv === 'medium' ? 'text-amber-700' : 'text-rose-700'
                      }`}>
                      {lv === 'easy' ? '0-200' : lv === 'medium' ? '201-400' : '401-800'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 게임 설정 */}
          <div className="bg-white p-4 md:p-5 rounded-[28px] border-4 border-black shadow-[8px_8px_0px_#000] flex flex-col h-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-[#FF007F] border-2 border-black rounded-xl flex items-center justify-center text-lg shadow-[2px_2px_0px_#000]">⚙️</div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">게임 환경 설정</h3>
                <p className="text-[9px] font-black text-slate-500">보너스 및 기타 편의 기능을 활성화하세요.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* 무결점 성공 보너스 */}
              <div className="bg-[#FF007F]/10 p-3 rounded-[20px] border-4 border-black shadow-[4px_4px_0px_#000] flex flex-col sm:flex-row items-center justify-between gap-2 min-h-[72px]">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black text-slate-900">무결점 성공 보너스</span>
                  <span className="text-[7px] font-black text-slate-500">오타 없이 완벽하게 성공 시 추가 점수</span>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    onClick={() => setEnableFlawlessBonus(!enableFlawlessBonus)}
                    className={`w-10 h-6 rounded-full border-2 border-black transition-all relative cursor-pointer shrink-0 ${enableFlawlessBonus ? 'bg-[#FF007F]' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white border-2 border-black rounded-full transition-all ${enableFlawlessBonus ? 'left-4.5' : 'left-0.5'}`}></div>
                  </button>

                  <div className={`flex items-center gap-1 bg-white py-0.5 px-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] shrink-0 transition-opacity ${enableFlawlessBonus ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <button
                      onClick={() => setComboWeight(prev => Math.max(50, prev - 10))}
                      disabled={!enableFlawlessBonus}
                      className="w-5 h-5 rounded-lg bg-slate-100 text-slate-800 hover:bg-rose-100 hover:text-rose-600 border-2 border-black font-black transition-all cursor-pointer flex items-center justify-center text-xs disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <div className="flex items-baseline px-1 min-w-[34px] justify-center">
                      <span className="text-xs font-black text-slate-900 leading-none">{comboWeight}</span>
                      <span className="text-[8px] font-black text-slate-500 ml-0.5">%</span>
                    </div>
                    <button
                      onClick={() => setComboWeight(prev => Math.min(100, prev + 10))}
                      disabled={!enableFlawlessBonus}
                      className="w-5 h-5 rounded-lg bg-slate-100 text-slate-800 hover:bg-indigo-100 hover:text-indigo-600 border-2 border-black font-black transition-all cursor-pointer flex items-center justify-center text-xs disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 학생 트랙 가림 */}
              <div className="bg-[#FF007F]/15 p-3 rounded-[20px] border-4 border-black shadow-[4px_4px_0px_#000] flex flex-col sm:flex-row items-center justify-between gap-2 min-h-[72px]">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black text-slate-900">학생화면 트랙 가림</span>
                  <span className="text-[7px] font-black text-slate-500">학생 화면에서 레이싱 가림</span>
                </div>
                <button
                  onClick={() => setHideStudentTrack(!hideStudentTrack)}
                  className={`w-10 h-6 rounded-full border-2 border-black transition-all relative cursor-pointer shrink-0 ${hideStudentTrack ? 'bg-[#FF007F]' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white border-2 border-black rounded-full transition-all ${hideStudentTrack ? 'left-4.5' : 'left-0.5'}`}></div>
                </button>
              </div>

              {/* 띄어쓰기 가이드 */}
              <div className="bg-[#00F0FF]/10 p-3 rounded-[20px] border-4 border-black shadow-[4px_4px_0px_#000] flex flex-col sm:flex-row items-center justify-between gap-2 min-h-[72px]">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black text-slate-900">띄어쓰기 가이드 표시</span>
                  <span className="text-[7px] font-black text-slate-500">문장 공백 자리에 가이드 기호 노출</span>
                </div>
                <button
                  onClick={() => setShowSpace(!showSpace)}
                  className={`w-10 h-6 rounded-full border-2 border-black transition-all relative cursor-pointer shrink-0 ${showSpace ? 'bg-[#00D8FF]' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white border-2 border-black rounded-full transition-all ${showSpace ? 'left-4.5' : 'left-0.5'}`}></div>
                </button>
              </div>

              {/* 문장 부호 제거 */}
              <div className="bg-[#00F0FF]/15 p-3 rounded-[20px] border-4 border-black shadow-[4px_4px_0px_#000] flex flex-col sm:flex-row items-center justify-between gap-2 min-h-[72px]">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black text-slate-900">문장 부호 제거</span>
                  <span className="text-[7px] font-black text-slate-500">마침표, 물음표 등 문장 부호 생략</span>
                </div>
                <button
                  onClick={() => setRemovePunctuation(!removePunctuation)}
                  className={`w-10 h-6 rounded-full border-2 border-black transition-all relative cursor-pointer shrink-0 ${removePunctuation ? 'bg-[#00D8FF]' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white border-2 border-black rounded-full transition-all ${removePunctuation ? 'left-4.5' : 'left-0.5'}`}></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 꾸러미 선택기 */}
        <div className="bg-[#FAF9F5] p-5 rounded-[28px] border-4 border-black shadow-[8px_8px_0px_#000]">
          <h3 className="text-xl font-black text-slate-900 mb-4 text-center">🎯 연습할 타자 꾸러미 선택</h3>
          <ContentSelector
            isPractice={true}
            onStartPractice={handleStartPractice}
            currentSettings={{
              comboWeight,
              showSpace,
              removePunctuation,
              hideStudentTrack,
              botSpeeds
            }}
          />
        </div>
      </div>

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
            <div className="relative w-28 h-16 flex items-center justify-center">
              <div className="text-5xl animate-bounce duration-500">🏎️</div>
              <div className="absolute bottom-0 w-16 h-1.5 bg-black/10 rounded-full blur-xs animate-pulse"></div>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900 flex items-center justify-center gap-1.5 animate-pulse">
                🚦 메인 화면으로 이동 중...
              </h3>
              <p className="text-[11px] text-slate-500 font-extrabold leading-relaxed">
                안전하게 대기실에서 나가는 중입니다.<br />잠시만 기다려 주세요!
              </p>
            </div>
            <div className="w-full h-5 bg-slate-100 border-3 border-black rounded-full overflow-hidden relative shadow-[inset_1.5px_1.5px_0px_rgba(0,0,0,0.15)]">
              <div className="h-full border-r-3 border-black animate-bar-flow" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
