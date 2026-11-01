"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TajaPangLogo from '../../components/TajaPangLogo';
import { appAlert, appConfirm, blockReloadKeys } from '@/lib/appDialog';

const CAR_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
  '#06B6D4', '#EAB308', '#D946EF', '#22C55E', '#334155'
];

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
  cpm?: number;
  combo?: number;
  currentIdx?: number;
}

const MiniCar = ({ color, nickname, isMe, idx, width = 60, scaleClass, tooltipPosition = 'top' }: { color?: string; nickname: string; isMe: boolean; idx: number; width?: number; scaleClass?: string; tooltipPosition?: 'top' | 'bottom' }) => {
  const mainColor = color || CAR_COLORS[Math.abs(idx) % CAR_COLORS.length];
  const carTypes = ['SPORTS', 'MUSCLE', 'RALLY', 'COMPACT', 'CLASSIC'];
  const carType = carTypes[Math.abs(idx) % carTypes.length];

  const getCarBody = () => {
    switch (carType) {
      case 'MUSCLE':
        return (
          <g>
            <path d="M10,60 L20,40 L45,35 L75,35 L95,45 L140,45 L150,55 L150,75 L10,75 Z" fill={mainColor} stroke="#111" strokeWidth="4" strokeLinejoin="miter" />
            <path d="M30,42 L48,38 L70,38 L85,45 L40,45 Z" fill="#94A3B8" stroke="#111" strokeWidth="3" strokeLinejoin="miter" />
            <path d="M72,38 L88,45 L72,45 Z" fill="#64748B" stroke="#111" strokeWidth="3" strokeLinejoin="miter" />
            <rect x="100" y="40" width="15" height="5" fill="#111" />
          </g>
        );
      case 'RALLY':
        return (
          <g>
            <path d="M5,45 L15,45 L15,25 L30,25 L30,32 L10,32 Z" fill="#111" />
            <path d="M15,55 L20,35 L50,30 L80,30 L105,45 L145,50 L150,65 L150,75 L10,75 Z" fill={mainColor} stroke="#111" strokeWidth="4" strokeLinejoin="miter" />
            <path d="M35,38 L52,33 L78,33 L95,45 L42,45 Z" fill="#94A3B8" stroke="#111" strokeWidth="3" strokeLinejoin="miter" />
            <path d="M40,55 L120,55" stroke="#FDE047" strokeWidth="4" strokeLinecap="square" />
            <path d="M40,62 L110,62" stroke="#EF4444" strokeWidth="3" strokeLinecap="square" />
          </g>
        );
      case 'COMPACT':
        return (
          <g>
            <path d="M15,60 C15,35 35,20 65,20 C95,20 115,35 135,50 L145,65 L145,75 L10,75 Z" fill={mainColor} stroke="#111" strokeWidth="4" strokeLinejoin="round" />
            <path d="M35,40 C45,30 65,28 85,32 L105,45 L40,45 Z" fill="#94A3B8" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
            <circle cx="135" cy="60" r="5" fill="#FDE047" stroke="#111" strokeWidth="2" />
          </g>
        );
      case 'CLASSIC':
        return (
          <g>
            <polygon points="5,65 10,50 35,45 50,25 90,25 110,45 145,45 150,55 150,75 5,75" fill={mainColor} stroke="#111" strokeWidth="4" strokeLinejoin="miter" />
            <polygon points="52,28 88,28 102,42 42,42" fill="#94A3B8" stroke="#111" strokeWidth="3" strokeLinejoin="miter" />
            <line x1="75" y1="28" x2="75" y2="42" stroke="#111" strokeWidth="4" />
          </g>
        );
      case 'SPORTS':
      default:
        return (
          <g>
            <path d="M10,65 L15,45 L45,30 L90,30 L125,45 L150,60 L150,75 L10,75 Z" fill={mainColor} stroke="#111" strokeWidth="4" strokeLinejoin="miter" />
            <polygon points="10,45 15,35 25,35 20,45" fill="#111" />
            <path d="M48,33 L85,33 L110,45 L55,45 Z" fill="#94A3B8" stroke="#111" strokeWidth="3" strokeLinejoin="miter" />
            <line x1="45" y1="55" x2="60" y2="55" stroke="#111" strokeWidth="3" />
            <line x1="48" y1="60" x2="58" y2="60" stroke="#111" strokeWidth="3" />
          </g>
        );
    }
  };

  return (
    <div className={`relative flex items-center justify-center transition-all origin-center group cursor-pointer ${scaleClass || 'scale-100'}`}>
      <div className={tooltipPosition === 'bottom'
        ? "absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-1.5 rounded-lg border-2 border-white font-black text-lg shadow-[4px_4px_0px_#000] opacity-0 group-hover:opacity-100 group-hover:mt-5 pointer-events-none transition-all duration-200 z-[999] whitespace-nowrap"
        : "absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-1.5 rounded-lg border-2 border-white font-black text-lg shadow-[4px_4px_0px_#000] opacity-0 group-hover:opacity-100 group-hover:-top-16 pointer-events-none transition-all duration-200 z-[999] whitespace-nowrap"
      }>
        {nickname}
      </div>
      <svg
        viewBox="0 0 160 100"
        width={width}
        height={(width / 160) * 100}
        xmlns="http://www.w3.org/2000/svg"
        className="select-none"
        style={{
          overflow: 'visible',
          filter: isMe ? 'drop-shadow(0 0 4px #FFE600) drop-shadow(2px 3px 0px rgba(0,0,0,0.2))' : 'drop-shadow(2px 3px 0px rgba(0,0,0,0.2))'
        }}
      >
        <g stroke="#111" strokeWidth="4" strokeLinecap="round">
          <circle cx="40" cy="75" r="14" fill="#222" />
          <circle cx="40" cy="75" r="5" fill="#fff" />
          <circle cx="120" cy="75" r="14" fill="#222" />
          <circle cx="120" cy="75" r="5" fill="#fff" />
        </g>
        {getCarBody()}
        <text
          x="80"
          y="66"
          fontFamily="sans-serif"
          fontSize="18"
          fontWeight="900"
          textAnchor="middle"
          fill="#111"
          stroke="#fff"
          strokeWidth="3"
          paintOrder="stroke"
        >
          {nickname.slice(0, 3)}
        </text>
      </svg>
    </div>
  );
};

// 2벌식 키보드 영타 -> 한글 변환 오토마타
const ENG_KEY_MAP: Record<string, string> = {
  q: 'ㅂ', Q: 'ㅃ', w: 'ㅈ', W: 'ㅉ', e: 'ㄷ', E: 'ㄸ', r: 'ㄱ', R: 'ㄲ', t: 'ㅅ', T: 'ㅆ',
  y: 'ㅛ', u: 'ㅕ', i: 'ㅑ', o: 'ㅐ', O: 'ㅒ', p: 'ㅔ', P: 'ㅖ',
  a: 'ㅁ', s: 'ㄴ', d: 'ㅇ', f: 'ㄹ', g: 'ㅎ',
  h: 'ㅗ', j: 'ㅓ', k: 'ㅏ', l: 'ㅣ',
  z: 'ㅋ', x: 'ㅌ', c: 'ㅊ', v: 'ㅍ', b: 'ㅠ', n: 'ㅜ', m: 'ㅡ'
};

const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONG = ['', 'ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

const COMBINED_VOWELS: Record<string, string> = {
  'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ',
  'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ',
  'ㅡㅣ': 'ㅢ'
};

const COMBINED_FINALS: Record<string, string> = {
  'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ',
  'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ',
  'ㅂㅅ': 'ㅄ'
};

function convertEngToKor(text: string): string {
  if (!/[a-zA-Z]/.test(text)) return text;

  // 1단계: 영문 알파벳을 2벌식 한글 자모로 1:1 변환
  let jamos = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    jamos += ENG_KEY_MAP[ch] || ch;
  }

  // 2단계: 자모를 완성형 한글 음절로 조립
  let result = '';
  let i = 0;
  const isCho = (c: string) => CHO.includes(c);
  const isJung = (c: string) => JUNG.includes(c);

  while (i < jamos.length) {
    const c1 = jamos[i];

    // 초성 자음으로 시작하고 바로 뒤에 모음이 오는 경우
    if (isCho(c1) && i + 1 < jamos.length && (isJung(jamos[i + 1]) || COMBINED_VOWELS[jamos[i + 1] + (jamos[i + 2] || '')])) {
      const choIdx = CHO.indexOf(c1);
      let jungChar = jamos[i + 1];
      let consumed = 2;

      // 복합 모음 검사 (예: ㅗ + ㅏ -> ㅘ)
      if (i + 2 < jamos.length && COMBINED_VOWELS[jungChar + jamos[i + 2]]) {
        jungChar = COMBINED_VOWELS[jungChar + jamos[i + 2]];
        consumed = 3;
      }
      const jungIdx = JUNG.indexOf(jungChar);

      if (jungIdx === -1) {
        result += c1;
        i++;
        continue;
      }

      // 종성 자음 검사
      let jongIdx = 0;
      const nextIdx = i + consumed;
      if (nextIdx < jamos.length && JONG.includes(jamos[nextIdx])) {
        // 뒤에 또 다른 모음이 바로 오지 않는 경우에만 종성으로 병합
        const afterNext = nextIdx + 1 < jamos.length ? jamos[nextIdx + 1] : '';
        if (!isJung(afterNext) && !COMBINED_VOWELS[afterNext + (jamos[nextIdx + 2] || '')]) {
          // 복합 종성 검사 (예: ㄳ, ㄵ 등)
          if (nextIdx + 1 < jamos.length && COMBINED_FINALS[jamos[nextIdx] + jamos[nextIdx + 1]]) {
            const afterDouble = nextIdx + 2 < jamos.length ? jamos[nextIdx + 2] : '';
            if (!isJung(afterDouble) && !COMBINED_VOWELS[afterDouble + (jamos[nextIdx + 3] || '')]) {
              const doubleFinal = COMBINED_FINALS[jamos[nextIdx] + jamos[nextIdx + 1]];
              jongIdx = JONG.indexOf(doubleFinal);
              consumed += 2;
            } else {
              jongIdx = JONG.indexOf(jamos[nextIdx]);
              consumed += 1;
            }
          } else {
            jongIdx = JONG.indexOf(jamos[nextIdx]);
            consumed += 1;
          }
        }
      }

      // 유니코드 완성형 한글 음절 계산: 0xAC00 + (cho * 21 + jung) * 28 + jong
      const code = 0xAC00 + (choIdx * 21 + jungIdx) * 28 + jongIdx;
      result += String.fromCharCode(code);
      i += consumed;
    } else {
      result += c1;
      i++;
    }
  }

  return result;
}

export default function PracticePlay() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // 로컬 상태
  const [problemSet, setProblemSet] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [targetText, setTargetText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isEngModeWarning, setIsEngModeWarning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [cpm, setCpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isError, setIsError] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [roomStatus, setRoomStatus] = useState("playing");
  const [roomSettings, setRoomSettings] = useState<any>({});
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownFinished, setCountdownFinished] = useState(false);

  // 통계 누적
  const [cumulativeChars, setCumulativeChars] = useState(0);
  const [cumulativeCorrect, setCumulativeCorrect] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [maxErrorInCurrentSentence, setMaxErrorInCurrentSentence] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(false);

  // 시뮬레이션용 Ref
  const participantsRef = useRef<Participant[]>([]);
  const roomSettingsRef = useRef<any>({});
  const botProgressRef = useRef<Record<string, number>>({});

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    roomSettingsRef.current = roomSettings;
  }, [roomSettings]);

  // 연습 중 새로고침 키 입력 방지
  useEffect(() => {
    if (!countdownFinished || roomStatus !== 'playing') return;
    return blockReloadKeys('새로고침하면 진행 중인 게임이 초기화되어요. 새로고침을 막았습니다.');
  }, [countdownFinished, roomStatus]);

  // sessionStorage 데이터 가져오기
  useEffect(() => {
    const rawProblemSet = sessionStorage.getItem('tajapang_practice_problemSet');
    const rawSettings = sessionStorage.getItem('tajapang_practice_settings');
    const rawParticipants = sessionStorage.getItem('tajapang_practice_participants');

    if (!rawProblemSet || !rawParticipants) {
      appAlert("연습 세션이 유효하지 않습니다. 대기실로 이동합니다.");
      router.push('/practice');
      return;
    }

    const pSet = JSON.parse(rawProblemSet);
    const settings = rawSettings ? JSON.parse(rawSettings) : {};
    const pts = JSON.parse(rawParticipants);

    setProblemSet(pSet);
    setRoomSettings(settings);
    setParticipants(pts.map((p: any) => ({ ...p, progress: 0, score: 0, currentIdx: 0, cpm: 0 })));

    if (pSet.length > 0) {
      setTargetText(pSet[0]);
    }
  }, [router]);

  // 카운트다운 인터벌
  useEffect(() => {
    if (roomStatus === 'playing') {
      if (countdown === null && !countdownFinished) {
        setCountdown(3);
      }
    }
  }, [roomStatus, countdown, countdownFinished]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      const timer = setTimeout(() => {
        setCountdown(null);
        setCountdownFinished(true);
        setStartTime(Date.now());
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (countdownFinished && roomStatus === 'playing') {
      inputRef.current?.focus();
    }
  }, [countdownFinished, roomStatus]);

  // 타수(CPM) 및 정확도 갱신
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!countdownFinished || roomStatus !== 'playing') return;
    let rawValue = e.target.value;
    const hasEnglish = /[a-zA-Z]/.test(rawValue);
    if (hasEnglish) {
      setIsEngModeWarning(true);
      rawValue = convertEngToKor(rawValue);
    } else {
      setIsEngModeWarning(false);
    }
    const value = rawValue;
    setUserInput(value);

    if (!startTime) return;
    const elapsedMinutes = (Date.now() - startTime) / 60000;

    // 현재 문장에서 맞게 타이핑한 글자 수 구하기
    let currentChars = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === targetText[i]) currentChars++;
    }

    // 누적 총 한글 획수(타자 수) 계산 (간단 가속도 식: 한글 1글자 평균 3타)
    const currentCorrectKeystrokes = (cumulativeCorrect + currentChars) * 3;
    const currentCpm = elapsedMinutes > 0 ? Math.floor(currentCorrectKeystrokes / elapsedMinutes) : 0;
    setCpm(currentCpm);

    // 실시간 오타 판정 및 키 스트로크 기록
    const keystrokeDiff = value.length - userInput.length;
    if (keystrokeDiff > 0) {
      setTotalKeystrokes(prev => prev + keystrokeDiff * 3);
    }

    // 정확도 계산 (백스페이스 누적을 활용한 정타 확률 판정)
    const totalCorrect = cumulativeCorrect + currentChars;
    const totalTypo = totalErrors + backspaceCount;
    const currentAcc = (totalCorrect + totalTypo) > 0
      ? Math.max(0, Math.floor((totalCorrect / (totalCorrect + totalTypo)) * 100))
      : 100;
    setAccuracy(currentAcc);

    const currentIsError = value.split('').some((char, i) => {
      // 실시간 에러 표시 상태에서도 동일하게 조합 중인 자소는 예외
      if (i === value.length - 1 && isComposing) return false;
      const isJaso = /[ㄱ-ㅎㅏ-ㅣ]/.test(char);
      if (isJaso && i === value.length - 1) return false;
      return char !== targetText[i];
    });
    setIsError(currentIsError);
    if (showWarning) setShowWarning(false);

    // 내 자동차 실시간 이동을 위한 로컬 상태 동기화
    const overallProgress = problemSet.length > 0
      ? ((currentIdx / problemSet.length) * 100) + ((currentChars / targetText.length) * (100 / problemSet.length))
      : 0;

    setParticipants(prev => prev.map(p => p.id === 'me' ? {
      ...p,
      progress: Math.floor(overallProgress),
      cpm: currentCpm,
      accuracy: currentAcc
    } : p));
  };

  // 키 입력 핸들러 (백스페이스 및 키 스트로크 카운트)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setTotalKeystrokes(prev => prev + 1);
    if (e.key === 'Backspace' || e.code === 'Backspace' || e.keyCode === 8) {
      setBackspaceCount(prev => prev + 1);
    }
  };

  // 엔터 입력 시 처리
  const handleSentenceSubmit = () => {
    if (userInput === targetText) {
      const nextIdx = currentIdx + 1;
      const isLast = nextIdx >= problemSet.length;

      setUserInput('');
      setIsComposing(false);
      setShowWarning(false);
      setIsEngModeWarning(false);
      if (inputRef.current) inputRef.current.value = '';

      const newCombo = (isError || backspaceCount > 0) ? combo : combo + 1;
      setCombo(newCombo);
      setCumulativeChars(prev => prev + targetText.length);
      setCumulativeCorrect(prev => prev + targetText.length);

      // 문장 완료 시 백스페이스 수 오타 누적 및 리셋
      setTotalErrors(prev => prev + backspaceCount);
      setMaxErrorInCurrentSentence(0);
      setBackspaceCount(0);

      // 점수 연산
      const accScoreFactor = (accuracy / 100) * 0.5 + 0.5;
      const baseSentenceScore = Math.floor(targetText.length * accScoreFactor);

      const isFlawless = !isError && backspaceCount === 0;
      const isFlawlessBonusActive = roomSettings?.enableFlawlessBonus !== false;
      const flawlessRate = isFlawlessBonusActive ? (roomSettings?.comboWeight !== undefined ? roomSettings.comboWeight : 50) / 100 : 0;
      const flawlessBonus = isFlawless ? Math.floor(baseSentenceScore * flawlessRate) : 0;

      const sentenceScore = baseSentenceScore + flawlessBonus + Math.floor(cpm / 15);
      const totalScore = (score || 0) + sentenceScore;
      setScore(totalScore);
      setIsError(false);

      if (!isLast) {
        setCurrentIdx(nextIdx);
        setTargetText(problemSet[nextIdx] || "");

        setParticipants(prev => prev.map(p => p.id === 'me' ? {
          ...p,
          currentIdx: nextIdx,
          progress: Math.floor((nextIdx / problemSet.length) * 100),
          combo: newCombo,
          score: totalScore,
          cpm,
          accuracy
        } : p));
      } else {
        setCurrentIdx(problemSet.length);
        const myFinalData = {
          progress: 100,
          currentIdx: problemSet.length,
          combo: newCombo,
          score: totalScore,
          cpm,
          accuracy,
          completedAt: Date.now()
        };

        setParticipants(prev => prev.map(p => p.id === 'me' ? { ...p, ...myFinalData } : p));
        // 내가 완주하면 즉시 게임 완료 처리
        setRoomStatus('finished');
      }
    } else {
      setShowWarning(true);
      setIsError(true);
    }
  };

  // 🤖 AI 봇 이동 시뮬레이션 인터벌 구동 (로컬 전용)
  useEffect(() => {
    if (problemSet.length === 0 || roomStatus !== 'playing' || !countdownFinished) return;

    const botInterval = setInterval(() => {
      if (participantsRef.current.length === 0) return;

      let allFinished = true;
      const newParticipants = participantsRef.current.map(p => {
        if (!p.isBot) {
          if ((p.currentIdx || 0) < problemSet.length) {
            allFinished = false;
          }
          return p;
        }

        const currentBotIdx = p.currentIdx || 0;
        if (currentBotIdx >= problemSet.length) {
          return p; // 이미 완주함
        }

        allFinished = false;

        // 소수점 봇 진행률 보존
        if (botProgressRef.current[p.id] === undefined) {
          botProgressRef.current[p.id] = p.progress || 0;
        }
        const currentBotProgress = botProgressRef.current[p.id];

        // 문장 딜레이
        const sentenceStartThreshold = (currentBotIdx / problemSet.length) * 100;
        if (currentBotProgress <= sentenceStartThreshold + 0.3) {
          if (Math.random() > 0.4) return p;
        }

        // 난이도 속도 로드
        const level = p.botLevel || 'easy';
        const speeds = roomSettingsRef.current.botSpeeds || {};
        const rawSpeed = speeds[level] || (level === 'easy' ? 100 : level === 'medium' ? 220 : 400);

        const speedLimits = {
          easy: { min: 30, max: 150 },
          medium: { min: 151, max: 300 },
          hard: { min: 301, max: 500 }
        };
        const limit = speedLimits[level];
        const baseSpeed = Math.min(limit.max, Math.max(limit.min, rawSpeed));

        const rhythm = 0.85 + Math.random() * 0.3;
        const targetCPM = baseSpeed * rhythm;

        const currentTargetText = problemSet[currentBotIdx] || "";
        const expectedStrokesPerSec = targetCPM / 60;
        const totalStrokesForSentence = currentTargetText.length * 3;
        const sentenceProgressStep = (expectedStrokesPerSec / totalStrokesForSentence) * (100 / problemSet.length);

        const nextProgress = Math.min(100, currentBotProgress + sentenceProgressStep);
        botProgressRef.current[p.id] = nextProgress;

        const sentenceThreshold = ((currentBotIdx + 1) / problemSet.length) * 100;

        if (nextProgress >= sentenceThreshold) {
          botProgressRef.current[p.id] = sentenceThreshold;
          const botAccuracy = 85 + Math.floor(Math.random() * 14);
          const botScore = (p.score || 0) + Math.floor((currentTargetText.length * (botAccuracy / 100)) + (targetCPM / 67));

          return {
            ...p,
            progress: Math.floor(sentenceThreshold),
            currentIdx: currentBotIdx + 1,
            cpm: Math.min(limit.max, Math.max(limit.min, Math.floor(baseSpeed * (0.9 + Math.random() * 0.2)))),
            accuracy: botAccuracy,
            score: botScore,
            completedAt: currentBotIdx + 1 >= problemSet.length ? Date.now() : undefined
          };
        } else {
          return {
            ...p,
            progress: Math.floor(nextProgress),
            cpm: Math.min(limit.max, Math.max(limit.min, Math.floor(baseSpeed * (0.8 + Math.random() * 0.4))))
          };
        }
      });

      setParticipants(newParticipants);

      if (allFinished) {
        setRoomStatus('finished');
        clearInterval(botInterval);
      }
    }, 1000);

    return () => clearInterval(botInterval);
  }, [problemSet, roomStatus, countdownFinished]);

  // 랭킹 정렬 리스트
  const sortedRankParticipants = [...participants].sort((a, b) => {
    // 1. 점수 내림차순
    if ((b.score ?? 0) !== (a.score ?? 0)) return (b.score ?? 0) - (a.score ?? 0);
    // 2. 완주자 선착순
    if (a.progress === 100 && b.progress === 100) {
      const ca = a.completedAt ?? 9999999999999;
      const cb = b.completedAt ?? 9999999999999;
      if (ca !== cb) return ca - cb;
    }
    // 3. 진행률 내림차순
    if ((b.progress ?? 0) !== (a.progress ?? 0)) return (b.progress ?? 0) - (a.progress ?? 0);
    // 4. 정확도 내림차순
    return (b.accuracy ?? 0) - (a.accuracy ?? 0);
  });

  const StatCard = ({ label, value, subLabel, color, bgColor, rotation, compact }: { label: string, value: string | number, subLabel?: string, color: string, bgColor: string, rotation: string, compact?: boolean }) => (
    <div className={`flex-1 bg-white border-4 border-black rounded-[20px] shadow-[4px_4px_0px_#000] flex transition-transform hover:scale-102 ${compact
      ? 'flex-row items-center justify-center gap-2 !py-1.5 !px-3.5 !rounded-xl shadow-[3px_3px_0px_#000]'
      : 'flex-col justify-between items-center text-center p-2.5'
      } ${bgColor} ${rotation}`}>
      {compact ? (
        <div className="flex items-center justify-center gap-1.5 w-full font-black text-slate-900 text-sm md:text-xl lg:text-2xl whitespace-nowrap">
          <span>{label}</span>
          <span className="text-black/30 font-black">:</span>
          <span className={`${color}`}>{value}</span>
          {subLabel && <span className="text-[10px] md:text-sm text-slate-700 font-black">{subLabel}</span>}
        </div>
      ) : (
        <>
          <span className="font-black text-slate-800 uppercase tracking-widest border-b-2 border-black/10 pb-0.5 mb-1.5 w-full text-[10px]">{label}</span>
          <div className="flex items-baseline gap-0.5">
            <span className={`font-black ${color} text-2xl`}>{value}</span>
            {subLabel && <span className="font-bold text-slate-700 text-[10px]">{subLabel}</span>}
          </div>
        </>
      )}
    </div>
  );

  const isFinished = currentIdx >= problemSet.length || roomStatus === 'finished';

  return (
    <main className={`bg-[#FFF59D] p-2 flex flex-col justify-between ${isFinished
      ? 'min-h-screen overflow-y-auto h-auto'
      : 'h-screen overflow-hidden'
      }`}>
      {/* 상단바 */}
      <div className="flex justify-between items-center bg-white py-2 px-4 rounded-[20px] border-4 border-black shadow-[4px_4px_0px_#000] mb-2 w-full gap-3">
        <div className="flex flex-col items-center sm:items-start">
          <TajaPangLogo size="sm" />
          <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_#000] leading-none -mt-0.5">
            🎯 개인연습모드
          </span>
        </div>

        {/* 내 스탯 대시보드 */}
        <div className="hidden md:flex flex-1 justify-center mx-6 gap-3">
          <StatCard label="현재 타수" value={Math.floor(cpm)} subLabel="타" color="text-indigo-600" bgColor="bg-[#FFDE4D]" rotation="-rotate-1" compact />
          <StatCard label="정확도" value={`${Math.floor(accuracy)}%`} color="text-emerald-600" bgColor="bg-[#FFB0B0]" rotation="rotate-1" compact />
          <StatCard label="무결점 성공" value={combo} subLabel="회" color="text-amber-600" bgColor="bg-[#BFF6C3]" rotation="-rotate-1" compact />
          <StatCard label="누적 점수" value={Math.floor(score).toLocaleString()} color="text-rose-600" bgColor="bg-[#E2F1AF]" rotation="rotate-1" compact />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="bg-slate-100 border-4 border-black px-5 py-2 rounded-xl text-center leading-none shadow-[3px_3px_0px_#000]">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-0.5">MODE</span>
            <span className="text-xl font-black text-indigo-600 tracking-wider">연습 모드</span>
          </div>
          <button
            onClick={async () => {
              if (await appConfirm("연습을 중단하고 대기실로 나가시겠습니까?")) {
                setLoading(true);
                router.push('/practice');
              }
            }}
            className="bg-rose-500 text-white text-xs md:text-sm px-4 py-2.5 rounded-xl border-4 border-black hover:bg-rose-600 hover:-translate-y-0.5 transition-all font-black cursor-pointer shadow-[3px_3px_0px_#000] active:translate-y-0 active:shadow-[1px_1px_0px_#000]"
          >
            🚪 나가기
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-1 gap-2.5 overflow-hidden">
        {roomStatus === 'finished' ? (
          /* 게임 종료 최종 결과 리포트 */
          <div className="flex-grow flex flex-col items-center justify-center bg-white rounded-[32px] border-4 border-black p-8 shadow-[8px_8px_0px_#000] max-w-2xl mx-auto w-full my-6 text-center animate-in fade-in duration-500">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">타자 레이싱 완료!</h2>
            <p className="text-slate-500 text-sm font-bold mb-6">연습한 최종 결과 리포트입니다.</p>

            {/* 나의 상세 리포트 */}
            <div className="grid grid-cols-4 gap-3.5 mb-6 w-full max-w-md">
              <div className="bg-[#FFDE4D]/15 border-2 border-black rounded-2xl p-3 flex flex-col items-center justify-center">
                <span className="text-[8px] font-black text-slate-400 block mb-0.5">최종 타수</span>
                <span className="text-xl font-black text-indigo-600">{Math.floor(cpm)}타</span>
              </div>
              <div className="bg-[#FFB0B0]/15 border-2 border-black rounded-2xl p-3 flex flex-col items-center justify-center">
                <span className="text-[8px] font-black text-slate-400 block mb-0.5">최종 정확도</span>
                <span className="text-xl font-black text-emerald-600">{Math.floor(accuracy)}%</span>
              </div>
              <div className="bg-[#BFF6C3]/15 border-2 border-black rounded-2xl p-3 flex flex-col items-center justify-center">
                <span className="text-[8px] font-black text-slate-400 block mb-0.5">무결점 성공</span>
                <span className="text-xl font-black text-amber-600">{combo}회</span>
                <span className="text-[9px] font-bold text-slate-500 mt-0.5">(총 지우기: {totalErrors}회)</span>
              </div>
              <div className="bg-[#E2F1AF]/15 border-2 border-black rounded-2xl p-3 flex flex-col items-center justify-center">
                <span className="text-[8px] font-black text-slate-400 block mb-0.5">최종 점수</span>
                <span className="text-xl font-black text-rose-600">{Math.floor(score).toLocaleString()}</span>
              </div>
            </div>

            {/* 순위 테이블 */}
            <div className="w-full space-y-2 mb-8 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar max-w-md">
              {sortedRankParticipants.map((p, idx) => (
                <div key={`final-rank-${p.id || idx}`} className={`flex items-center justify-between border-2 border-black p-3 rounded-xl shadow-[2px_2px_0px_#000] ${p.id === 'me' ? 'bg-[#FFE600]' : 'bg-slate-50'}`}>
                  <span className="font-black text-slate-800">{idx + 1}등. {p.nickname} {p.id === 'me' ? '(나)' : ''}</span>
                  <span className="font-black text-indigo-600 text-base">{Math.floor(p.score || 0).toLocaleString()}점 ({Math.floor(p.cpm || 0)}타)</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/practice')}
              className="bg-[#00F0FF] text-slate-900 border-4 border-black px-10 py-3.5 rounded-full font-black text-lg shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] active:scale-95 transition-all cursor-pointer"
            >
              🏠 대기실로 돌아가기
            </button>
          </div>
        ) : (
          /* 인게임 플레이 화면 */
          <div className="flex-grow flex gap-2.5 overflow-hidden">
            <div className="flex-1 flex flex-col gap-2 relative">
              {/* 모바일 상단 스탯 */}
              <div className="flex justify-center gap-1.5 md:hidden">
                <StatCard label="현재 타수" value={Math.floor(cpm)} subLabel="타" color="text-indigo-600" bgColor="bg-[#FFDE4D]" rotation="-rotate-1" />
                <StatCard label="정확도" value={`${Math.floor(accuracy)}%`} color="text-emerald-500" bgColor="bg-[#FFB0B0]" rotation="rotate-2" />
                <StatCard label="무결점 성공" value={combo} subLabel="회" color="text-amber-500" bgColor="bg-[#BFF6C3]" rotation="-rotate-2" />
                <StatCard label="누적 점수" value={Math.floor(score).toLocaleString()} color="text-rose-500" bgColor="bg-[#E2F1AF]" rotation="rotate-1" />
              </div>

              {/* 칠판형 타자 입력판 */}
              <div
                onClick={() => { if (currentIdx < problemSet.length && !isFinished) inputRef.current?.focus(); }}
                className="flex-grow bg-slate-800 border-4 border-black rounded-[32px] shadow-[8px_8px_0px_#000] p-6 flex flex-col items-center justify-center text-center relative overflow-hidden cursor-text select-none min-h-[240px]"
              >
                {/* 칠판 상단 좌측 모드 뱃지 */}
                <div className="absolute top-3 left-4 flex items-center gap-2 z-10">
                  <span className="bg-emerald-600 text-white border-2 border-black px-2.5 py-0.5 rounded-md text-[9.5px] font-black shadow-[1.5px_1.5px_0px_#000] flex items-center gap-1">
                    <span>🇰🇷</span>
                    <span>한글 입력 모드</span>
                  </span>
                </div>

                {/* 칠판 상단 우측 뱃지 그룹 (오른쪽 룸플레이어 스타일) */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                  <span className="bg-rose-600 text-white border-2 border-black px-2.5 py-0.5 rounded-md text-[9.5px] font-black shadow-[1.5px_1.5px_0px_#000]">
                    Backspace: {backspaceCount}
                  </span>
                  <span className="bg-slate-700 text-slate-300 border-2 border-black px-2.5 py-0.5 rounded-md text-[9.5px] font-black shadow-[1.5px_1.5px_0px_#000]">
                    Progress: {currentIdx} / {problemSet.length}
                  </span>
                </div>

                {/* 중앙 텍스트 컨테이너 */}
                <div className="w-full flex-grow flex flex-col justify-center items-center gap-4 my-2">
                  {/* 제시어 영역 (글자별 타이핑 검증 + 엔터 기호 가이드) - 방번호와 동일한 Noto Sans KR 폰트 적용 */}
                  <p className="font-['Noto_Sans_KR',sans-serif] text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-snug flex flex-wrap justify-center gap-x-1 text-white text-center select-none">
                    {(() => {
                      const letters = targetText.split('').map((char, index) => {
                        let color = "text-white/20";
                        if (index < userInput.length) {
                          color = userInput[index] === char ? "text-amber-300" : "text-rose-500";
                        }

                        if (char === ' ') {
                          return (
                            <span key={index} className={color}>
                              {roomSettings?.showSpace ? '␣' : '\u00A0'}
                            </span>
                          );
                        }
                        return (
                          <span key={index} className={color}>
                            {char}
                          </span>
                        );
                      });

                      // 마지막 글자 바로 뒤에 엔터 가이드 기호 (↵) 추가
                      const isAllTyped = userInput.length === targetText.length;
                      const enterSymbolClass = isAllTyped
                        ? "text-[#FFE600] font-black drop-shadow-[0_0_8px_rgba(255,230,0,0.6)] animate-pulse pl-1.5"
                        : "text-white/10 font-normal pl-1.5";

                      letters.push(
                        <span key="enter-guide-symbol" className={enterSymbolClass} style={{ verticalAlign: 'middle' }}>
                          ↵
                        </span>
                      );

                      return letters;
                    })()}
                  </p>

                  {/* 인라인 입력창 (오른쪽 룸플레이어 스타일) - Noto Sans KR 폰트 및 한글 IME 속성 완비 */}
                  <div className="w-full max-w-3xl mt-4">
                    <input
                      ref={inputRef}
                      type="text"
                      lang="ko"
                      inputMode="text"
                      value={userInput}
                      onChange={handleTyping}
                      onKeyDown={handleKeyDown}
                      onKeyPress={(e) => { if (e.key === 'Enter' && !isComposing) handleSentenceSubmit(); }}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={() => setIsComposing(false)}
                      disabled={!countdownFinished || isFinished}
                      placeholder={countdownFinished ? "여기에 입력하세요" : "카운트다운 완료 후 입력이 가능합니다."}
                      className={`w-full bg-white/5 border-b-4 ${isError ? 'border-rose-500 focus:border-rose-500' : 'border-white/10 focus:border-[#FFE600]'} text-white text-3xl md:text-4xl p-3 md:p-4 outline-none focus:border-amber-300 transition-all text-center font-bold font-['Noto_Sans_KR',sans-serif] placeholder:text-white/10 placeholder:font-bold`}
                      autoComplete="off"
                      autoCapitalize="off"
                      autoFocus
                    />
                  </div>
                </div>

                {/* 영문 자판 감지 시 자동 변환 안내 배너 */}
                {isEngModeWarning && (
                  <div className="bg-[#FFF59D] text-slate-900 border-2 border-black px-4 py-1.5 rounded-xl text-xs font-black shadow-[2px_2px_0px_#000] mt-1 mb-1 animate-bounce-subtle flex items-center justify-center gap-1.5">
                    <span>💡</span>
                    <span>영문 자판이 감지되어 한글로 자동 변환 중입니다! [한/영] 키를 눌러주세요.</span>
                  </div>
                )}

                {/* 오타 가이드 알림창 */}
                {showWarning && (
                  <p className="text-rose-400 text-sm font-black mt-2 text-center animate-bounce-subtle">
                    ⚠️ 문장이 일치하지 않습니다. 오타를 수정하고 엔터를 눌러주세요!
                  </p>
                )}
              </div>

              {/* 실시간 3-2-1 카운트다운 레이어 */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-[32px] z-30 flex flex-col justify-center items-center animate-in fade-in duration-200">
                  <div className="bg-white border-4 border-black p-8 rounded-[40px] shadow-[8px_8px_0px_#000] text-center max-w-[280px] w-full transform animate-in zoom-in-95 duration-200">
                    <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-1.5">게임 준비</p>
                    <span className="text-7xl font-black text-indigo-600 block animate-bounce-subtle drop-shadow-[3px_3px_0px_#000] leading-none mb-2">
                      {countdown === 0 ? "출발!" : countdown}
                    </span>
                    <p className="text-[10px] text-slate-500 font-extrabold leading-relaxed">
                      준비하시고 키보드에 손을 올리세요!
                    </p>
                    <span className="inline-block mt-2.5 bg-emerald-100 text-emerald-800 border-2 border-black px-2.5 py-0.5 rounded-md text-[9.5px] font-black shadow-[1px_1px_0px_#000]">
                      🇰🇷 한글 입력 [한/영] 키를 확인하세요
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 우측 실시간 랭킹 보드 */}
            <div className="hidden lg:flex w-[260px] bg-white rounded-[32px] border-4 border-black p-4 text-slate-950 flex-col gap-3 h-full shadow-[8px_8px_0px_#000]">
              <h3 className="text-xs font-black uppercase tracking-widest border-b-2 border-black pb-2 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span>🏆 실시간 순위</span>
                </div>
                <span className="text-[8px] font-bold text-indigo-700 block leading-none">
                  ※ 점수 = 정확도/속도/보너스 합산
                </span>
              </h3>
              <div className="space-y-2 flex-grow overflow-y-auto pr-1 custom-scrollbar">
                {sortedRankParticipants.map((p, idx) => (
                  <div key={`rank-${p.id || idx}`} className={`p-2.5 rounded-xl flex items-center justify-between border-2 border-black shadow-[2px_2px_0px_#000] ${p.id === 'me' ? 'bg-[#FFE600]' : 'bg-slate-50'}`}>
                    <span className="text-xs font-black truncate max-w-[130px]">
                      {idx + 1}. {p.nickname}
                    </span>
                    <span className="text-xs font-black text-indigo-600">
                      {Math.floor(p.score || 0).toLocaleString()}점
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 하단 자동차 주행 트랙 렌더링 */}
        {!roomSettings?.hideStudentTrack && (
          <div className="bg-[#FAF9F5] border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000] p-3 w-full shrink-0 select-none overflow-hidden relative mt-2.5">
            <div className="flex justify-between items-center text-slate-700 text-xs px-1 border-b-2 border-slate-300 pb-1 mb-2">
              <span className="font-black">🏎️ 실시간 주행 레이싱 트랙</span>
              <span className="text-[10px] font-bold text-slate-400">결승선을 향해 달리세요! (오른쪽이 결승선)</span>
            </div>

            <div className="relative bg-[#2D6A4F] rounded-xl p-2 border-3 border-black overflow-hidden flex flex-col gap-1.5" style={{ height: `${Math.max(160, 40 + participants.length * 35)}px` }}>
              {participants.map((p, idx) => {
                const trackOffset = `${Math.min(92, Math.max(3, p.progress || 0))}%`;
                return (
                  <div key={`track-lane-${p.id || idx}`} className="relative h-7 flex items-center bg-[#1B4332]/40 rounded border-y border-dashed border-white/10 overflow-visible">
                    {/* 결승선 기선 */}
                    <div className="absolute right-[8%] inset-y-0 w-1 bg-white/40 border-r border-dashed border-white/20 z-0"></div>

                    {/* 자동차 주행 애니메이션 컨테이너 */}
                    <div
                      className="absolute transition-all duration-300 ease-out z-10"
                      style={{ left: trackOffset }}
                    >
                      <MiniCar
                        nickname={p.nickname}
                        isMe={p.id === 'me'}
                        idx={idx}
                        width={48}
                        tooltipPosition="top"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
                🚦 대기실로 이동 중...
              </h3>
              <p className="text-[11px] text-slate-500 font-extrabold leading-relaxed">
                안전하게 플레이 방에서 나가는 중입니다.<br />잠시만 기다려 주세요!
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
