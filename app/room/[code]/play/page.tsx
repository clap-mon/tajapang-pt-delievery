"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { saveStudentRecord } from '@/lib/storage';
import { getActiveHostRoom, setActiveHostRoom, getActiveGuestRoom, setActiveGuestRoom } from '@/src/net/room';
import TajaPangLogo from '../../../components/TajaPangLogo';

// 8비트 F1 픽셀 레이싱카 인라인 SVG 에셋
// 25가지 다양한 차량 색상 팔레트 (backup/svg.tsx 기준)
const CAR_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', // 파, 빨, 녹, 녹, 보
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16', // 핑크, 틸, 오렌지, 인디고, 라임
  '#06B6D4', '#EAB308', '#D946EF', '#22C55E', '#334155', // 시안, 머스타드, 푸시아, 그린, 슬레이트
  '#DC2626', '#EA580C', '#65A30D', '#059669', '#0891B2', // 진한 톤들
  '#2563EB', '#4F46E5', '#7C3AED', '#9333EA', '#C026D3'  // 딥 블루/퍼플 톤
];

// 백업 리소스 기반 전면 수정된 반응형 픽셀카 컴포넌트
const MiniCar = ({ color, nickname, isMe, idx, width = 60, scaleClass, tooltipPosition = 'top' }: { color?: string; nickname: string; isMe: boolean; idx: number; width?: number; scaleClass?: string; tooltipPosition?: 'top' | 'bottom' }) => {
  const mainColor = color || CAR_COLORS[Math.abs(idx) % CAR_COLORS.length];

  // 5가지 차종 할당
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

  const displayName = nickname ? (nickname.length > 3 ? nickname.slice(0, 3) : nickname) : "학생";

  return (
    <div className={`relative flex items-center justify-center transition-all origin-center group cursor-pointer ${scaleClass || 'scale-100'}`}>
      {/* 마우스 오버 시 슬그머니 떠오르는 거대 말풍선 이름표 (상단 레인은 아래로, 하단 레인은 위로) */}
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
        {/* 차체 렌더링 */}
        {getCarBody()}

        {/* 바퀴 공통 */}
        <g>
          <circle cx="35" cy="75" r="14" fill="#111" />
          <circle cx="35" cy="75" r="7" fill="#CBD5E1" />
          <circle cx="35" cy="75" r="3" fill="#111" />

          <circle cx="115" cy="75" r="14" fill="#111" />
          <circle cx="115" cy="75" r="7" fill="#CBD5E1" />
          <circle cx="115" cy="75" r="3" fill="#111" />
        </g>

        {/* 입체 데칼 이름표 (이중 텍스트 엠블럼) */}
        <text
          x="80"
          y="66"
          fontFamily="sans-serif"
          fontSize="24"
          fontWeight="900"
          textAnchor="middle"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="6"
          paintOrder="stroke"
          letterSpacing="-1px"
        >
          {displayName}
        </text>

        <text
          x="80"
          y="66"
          fontFamily="sans-serif"
          fontSize="24"
          fontWeight="900"
          textAnchor="middle"
          fill="#FDE047"
          letterSpacing="-1px"
        >
          {displayName}
        </text>
      </svg>
    </div>
  );
};

// 닉네임 3글자 제한 포맷터 헬퍼 (차량 데칼 봇 닉네임은 초급1, 고급12 형태로 동적 치환)
const formatNickname = (nickname?: string, name?: string) => {
  const display = nickname || name || '학생';

  const botMatch = display.match(/^(초급|중급|고급)봇\s*(\d+)$/);
  if (botMatch) {
    const [, prefix, num] = botMatch;
    return `${prefix}${num}`;
  }

  return display.length > 3 ? display.slice(0, 3) : display;
};

// 총점 기준 내림차순 랭킹 정렬 헬퍼 (1순위: 총점 -> 2순위: 완주 선착순 -> 3순위: 진행률 -> 4순위: 타속 -> 5순위: 정확도)
export const sortByScoreDesc = (a: any, b: any) => {
  // 1. 점수 내림차순 최우선
  if ((b.score ?? 0) !== (a.score ?? 0)) return (b.score ?? 0) - (a.score ?? 0);
  // 2. 완주자 선착순 (completedAt)
  if ((a.progress || 0) === 100 && (b.progress || 0) === 100) {
    const ca = a.completedAt ?? 9999999999999;
    const cb = b.completedAt ?? 9999999999999;
    if (ca !== cb) return ca - cb;
  }
  // 3. 진행률 내림차순
  if ((b.progress ?? 0) !== (a.progress ?? 0)) return (b.progress ?? 0) - (a.progress ?? 0);
  // 4. 타속(cpm) 내림차순
  if ((b.cpm ?? 0) !== (a.cpm ?? 0)) return (b.cpm ?? 0) - (a.cpm ?? 0);
  // 5. 정확도(accuracy) 내림차순
  return (b.accuracy ?? 100) - (a.accuracy ?? 100);
};

export default function GamePlay() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.code as string;

  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [fallbackReason, setFallbackReason] = useState('');

  const handleLeaveRoom = async () => {
    const confirmMsg = isTeacher
      ? "🚨 주의: 모든 학생의 게임이 즉시 종료됩니다!\n\n선생님이 나가시면 참여 중인 모든 학생의 접속이 끊어지고 방이 사라집니다.\n정말 방을 종료하고 나가시겠습니까?"
      : "정말 방을 나가 로비 화면으로 돌아가시겠습니까?";
    if (confirm(confirmMsg)) {
      if (isTeacher) {
        const host = getActiveHostRoom();
        if (host) {
          host.end({ status: 'finished', reason: '선생님이 방을 종료했습니다.' });
          setTimeout(() => {
            host.destroy();
            setActiveHostRoom(null);
          }, 300);
        }
      } else {
        const guest = getActiveGuestRoom();
        if (guest) {
          guest.destroy();
          setActiveGuestRoom(null);
        }
      }
      setTimeout(() => {
        router.push('/?view=join');
      }, isTeacher ? 350 : 0);
    }
  };

  const [problemSet, setProblemSet] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [targetText, setTargetText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [cpm, setCpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isError, setIsError] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [roomStatus, setRoomStatus] = useState("");
  const [isTeacher, setIsTeacher] = useState(false);
  const [myId, setMyId] = useState("");
  const [roomSettings, setRoomSettings] = useState<any>({});
  const [hideTeacherTrackLocal, setHideTeacherTrackLocal] = useState(false);
  const [isZoomedTrack, setIsZoomedTrack] = useState(false);

  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [teacherOnline, setTeacherOnline] = useState(true);
  const [reconnectSeconds, setReconnectSeconds] = useState(180);
  const [maxCpm, setMaxCpm] = useState(0);
  const [minCpm, setMinCpm] = useState(9999);
  const [practiceText, setPracticeText] = useState("");
  const [practiceInput, setPracticeInput] = useState("");
  const [showStudentReportModal, setShowStudentReportModal] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownFinished, setCountdownFinished] = useState(false);

  const startPractice = () => {
    if (problemSet.length === 0) return;
    const rndText = problemSet[Math.floor(Math.random() * problemSet.length)];
    setPracticeText(rndText);
    setPracticeInput("");
    setIsPracticeMode(true);
  };

  const handlePracticeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPracticeInput(e.target.value);
  };

  const handlePracticeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (practiceInput === practiceText) {
        const rndText = problemSet[Math.floor(Math.random() * problemSet.length)];
        setPracticeText(rndText);
        setPracticeInput("");
      }
    }
  };































  const [cumulativeChars, setCumulativeChars] = useState(0);
  const [cumulativeCorrect, setCumulativeCorrect] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [maxErrorInCurrentSentence, setMaxErrorInCurrentSentence] = useState(0);
  const [showWarning, setShowWarning] = useState(false); // 오타 발생 가이드 경고 상태

  const inputRef = useRef<HTMLInputElement>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const participantsRef = useRef<any[]>([]); // setInterval 클로저 방지용 Ref 참조 객체
  const roomSettingsRef = useRef<any>({});
  const botProgressRef = useRef<{ [botId: string]: number }>({});

  // 참가자 목록 변동 시 최신 참조 주입
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  // 0. 새로고침/탭 닫기 방지 경고 이벤트 리스너 (선생님 전용)
  useEffect(() => {
    const isTeacherUser = sessionStorage.getItem('tajapang_is_teacher') === 'true';
    if (!isTeacherUser) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '페이지를 벗어나면 게임방이 사라지고 접속한 학생들이 모두 퇴장합니다. 정말 이동하시겠습니까?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 1. 초기 설정 및 세션 정보 로드 (PeerJS 기반)
  useEffect(() => {
    if (!roomCode) return;
    const isTeacherUser = sessionStorage.getItem('tajapang_is_teacher') === 'true';
    setIsTeacher(isTeacherUser);

    const storedNickname = sessionStorage.getItem('tajapang_nickname') || (isTeacherUser ? '선생님' : '');
    if (!isTeacherUser && !storedNickname) {
      router.push('/?view=join');
      return;
    }

    const resolvedMyId = isTeacherUser
      ? 'teacher'
      : (getActiveGuestRoom()?.peer?.id || storedNickname || 'student');
    setMyId(resolvedMyId);

    // 대기실에서 넘겨준 시작 데이터 파싱
    let startData: any = null;
    try {
      const raw = sessionStorage.getItem('tajapang_start_data');
      if (raw) startData = JSON.parse(raw);
    } catch (_) {}

    if (startData) {
      const pData = startData.passage || startData;
      if (pData.problemSet && pData.problemSet.length > 0) {
        setProblemSet(pData.problemSet);
        if (pData.problemSet[0]) setTargetText(pData.problemSet[0]);
      }
      if (pData.settings) {
        setRoomSettings(pData.settings);
        roomSettingsRef.current = pData.settings;
      }
      setRoomStatus('playing');
    }

    if (isTeacherUser) {
      // [교사 호스트]
      const host = getActiveHostRoom();
      if (host) {
        const initialStudents = Array.from(host.students.values()).map(s => ({
          id: s.peerId,
          nickname: s.nickname,
          joinedAt: s.joinedAt,
          progress: 0,
          cpm: 0,
          accuracy: 100,
          score: 0,
          combo: 0
        }));

        let bots: any[] = [];
        if (startData?.passage?.bots || startData?.bots) {
          const rawBots = startData.passage?.bots || startData.bots;
          bots = rawBots.map((b: any) => ({ ...b, progress: 0, cpm: 0, accuracy: 100, score: 0 }));
        }
        setParticipants([...initialStudents, ...bots]);

        // 학생 진행도 수신 콜백
        host.updateCallbacks({
          onProgress: (peerId, data) => {
            setParticipants(prev => {
              const idx = prev.findIndex(p => p.id === peerId);
              if (idx === -1) return prev;
              const updated = [...prev];
              updated[idx] = { ...updated[idx], ...data };
              return updated.sort(sortByScoreDesc);
            });
          },
          onStudentJoin: (student) => {
            console.log(`[Host Play] 게임 중 입장: ${student.nickname} (다음 판 대기)`);
            setParticipants(prev => {
              if (prev.some(p => p.id === student.peerId)) return prev;
              return [...prev, {
                id: student.peerId,
                nickname: student.nickname,
                joinedAt: student.joinedAt,
                progress: 0,
                cpm: 0,
                accuracy: 100,
                score: 0,
                waitingNextGame: true
              }];
            });
          },
          onStudentLeave: (peerId) => {
            setParticipants(prev => prev.filter(p => p.id !== peerId));
          }
        });
      }
    } else {
      // [학생 게스트]
      const guest = getActiveGuestRoom();
      if (guest) {
        guest.updateCallbacks({
          onBoard: (data) => {
            if (data && data.participants) {
              setParticipants(data.participants);
            }
          },
          onEnd: (data) => {
            if (data && data.participants) {
              setParticipants(data.participants);
            }
            setRoomStatus('finished');
          },
          onMessage: (payload) => {
            if (payload?.type === 'event' && payload?.data?.name === 'RESET_ROOM') {
              router.push(`/room/${roomCode}`);
            }
          },
          onHostLost: (err) => {
            console.warn('[Guest Play] onHostLost');
            setFallbackReason('선생님과의 연결이 종료되었습니다.');
            setShowFallbackModal(true);
          },
          onFail: (err) => {
            setFallbackReason('연결이 지연되거나 종료되었습니다.');
            setShowFallbackModal(true);
          }
        });
      }
    }
  }, [roomCode, router]);

  // 교사: 1초마다 board 메시지로 순위표 방송
  useEffect(() => {
    if (!isTeacher) return;
    const timer = setInterval(() => {
      const host = getActiveHostRoom();
      if (host && participantsRef.current.length > 0) {
        host.sendBoard({
          participants: participantsRef.current,
          status: 'playing'
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isTeacher]);

  // 새로고침/탭닫기/뒤로가기 실수 방지용 브라우저 경고 추가
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (roomStatus === 'playing') {
        e.preventDefault();
        e.returnValue = ''; // 크롬/사파리 기본 안내 경고
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [roomStatus]);

  // 3. 방장 유실 시 3분(180초) 재연결 대기 및 자동 청소 타이머
  useEffect(() => {
    if (isTeacher || !roomCode || teacherOnline) {
      setReconnectSeconds(180);
      return;
    }

    const timer = setInterval(() => {
      setReconnectSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGracePeriodTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [teacherOnline, isTeacher, roomCode]);

  const handleGracePeriodTimeout = async () => {
    router.push('/?view=join');
  };

  // 3. 교사용 전체 참가자 완료 여부 실시간 감시 (자동 finished 동기화)
  useEffect(() => {
    if (!isTeacher || participants.length === 0 || roomStatus !== 'playing') return;
    const activeParticipants = participants.filter(p => !p.waitingNextGame);
    if (activeParticipants.length === 0) return;
    const allFinished = activeParticipants.every(p => (p.progress || 0) >= 100);
    if (allFinished) {
      setRoomStatus('finished');
      const host = getActiveHostRoom();
      if (host) {
        host.end({ participants, status: 'finished' });
      }
    }
  }, [participants, isTeacher, roomStatus]);

  // 4. 현재 문장 관리
  useEffect(() => {
    if (problemSet.length > 0 && currentIdx < problemSet.length) {
      let nextText = problemSet[currentIdx];
      if (roomSettings?.removePunctuation) {
        nextText = nextText.replace(/[.,!?;:"'()\[\]{}\-<>@#$%^&*=_+|\\~`]/g, "").trim();
        nextText = nextText.replace(/\s+/g, ' ');
      }
      setTargetText(nextText);
    }
  }, [currentIdx, problemSet, roomSettings?.removePunctuation]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isTeacher) return;
    setTotalKeystrokes(prev => prev + 1);

    // 한글 조합 중(isComposing) 브라우저가 e.key를 'Process'로 매핑하는 IME 표준 스펙 한계를 극복하기 위해
    // 물리적 키 코드(e.code) 및 가상 키코드(e.keyCode)를 다중 검증하여 백스페이스를 확실히 포착합니다.
    if (e.key === 'Backspace' || e.code === 'Backspace' || e.keyCode === 8) {
      setBackspaceCount(prev => prev + 1);
    }
    // 문장을 다 친 후 엔터 키를 누를 때 판정 처리
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isComposing) return;
      handleSentenceSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isTeacher) return;

    const value = e.target.value;
    setUserInput(value);
    if (!startTime && value.length > 0) setStartTime(Date.now());

    const currentChars = value.length;
    let currentCorrect = 0;
    let currentErrors = 0;
    value.split('').forEach((char, i) => {
      // 1. 마지막 글자이면서 조합 중(isComposing)일 때는 예외
      if (i === value.length - 1 && isComposing) {
        return;
      }
      // 2. 단일 자음/모음(초성/중성 단독) 상태이고 마지막 글자이면 예외
      const isJaso = /[ㄱ-ㅎㅏ-ㅣ]/.test(char);
      if (isJaso && i === value.length - 1) {
        return;
      }

      if (char === targetText[i]) {
        currentCorrect++;
      } else {
        currentErrors++;
      }
    });

    const elapsedMinutes = (Date.now() - (startTime || Date.now())) / 60000;
    const currentCpm = elapsedMinutes > 0 ? Math.floor(((cumulativeCorrect + currentCorrect) * 3) / elapsedMinutes) : 0;

    // 실시간 최대 오타 수 갱신
    const updatedMaxError = Math.max(maxErrorInCurrentSentence, currentErrors);
    setMaxErrorInCurrentSentence(updatedMaxError);

    // 정확도 연산 (백스페이스 누적을 활용한 정타 확률 판정)
    const totalCorrect = cumulativeCorrect + currentCorrect;
    const totalTypo = totalErrors + backspaceCount;
    const currentAcc = (totalCorrect + totalTypo) > 0
      ? Math.max(0, Math.floor((totalCorrect / (totalCorrect + totalTypo)) * 100))
      : 100;

    setCpm(currentCpm);
    if (currentCpm > 0) {
      setMaxCpm(prev => Math.max(prev, currentCpm));
      setMinCpm(prev => Math.min(prev, currentCpm));
    }
    if (currentIdx === 0 && value.length === 0) {
      if (maxCpm !== 0) setMaxCpm(0);
      if (minCpm !== 9999) setMinCpm(9999);
    }
    if (currentCpm > 0) {
      setMaxCpm(prev => Math.max(prev, currentCpm));
      setMinCpm(prev => Math.min(prev, currentCpm));
    }
    if (currentIdx === 0 && value.length === 0) {
      if (maxCpm !== 0) setMaxCpm(0);
      if (minCpm !== 9999) setMinCpm(9999);
    }
    if (currentCpm > 0) {
      setMaxCpm(prev => Math.max(prev, currentCpm));
      setMinCpm(prev => Math.min(prev, currentCpm));
    }
    if (currentIdx === 0 && value.length === 0) {
      if (maxCpm !== 0) setMaxCpm(0);
      if (minCpm !== 9999) setMinCpm(9999);
    }
    if (currentCpm > 0) {
      setMaxCpm(prev => Math.max(prev, currentCpm));
      setMinCpm(prev => Math.min(prev, currentCpm));
    }
    if (currentIdx === 0 && value.length === 0) {
      if (maxCpm !== 0) setMaxCpm(0);
      if (minCpm !== 9999) setMinCpm(9999);
    }
    if (currentCpm > 0) {
      setMaxCpm(prev => Math.max(prev, currentCpm));
      setMinCpm(prev => Math.min(prev, currentCpm));
    }
    if (currentIdx === 0 && value.length === 0) {
      if (maxCpm !== 0) setMaxCpm(0);
      if (minCpm !== 9999) setMinCpm(9999);
    }
    setAccuracy(currentAcc);

    const currentIsError = value.split('').some((char, i) => char !== targetText[i]);
    setIsError(currentIsError);

    // 사용자가 수정 입력을 시도하면 오타 경고 가이드를 숨김
    if (showWarning) setShowWarning(false);

    const overallProgress = problemSet.length > 0
      ? ((currentIdx / problemSet.length) * 100) + ((currentChars / targetText.length) * (100 / problemSet.length))
      : 0;

    // 실시간 동기화 (GuestRoom.sendProgress는 0.5초 스로틀링 내장)
    if (!isTeacher) {
      const guest = getActiveGuestRoom();
      if (guest) {
        guest.sendProgress({
          progress: Math.floor(overallProgress),
          cpm: currentCpm,
          accuracy: currentAcc,
          combo: combo,
          score: score,
          currentIdx: currentIdx
        });
      }
    }
  };

  // 엔터 입력 시 문장 판정 및 다음 문장 천이 핸들러
  const handleSentenceSubmit = () => {
    if (userInput === targetText) {
      const nextIdx = currentIdx + 1;
      const isLast = nextIdx >= problemSet.length;

      setUserInput('');
      setIsComposing(false);
      setShowWarning(false);
      if (inputRef.current) inputRef.current.value = '';

      const newCombo = (isError || backspaceCount > 0) ? combo : combo + 1;
      setCombo(newCombo);
      setCumulativeChars(prev => prev + targetText.length);
      setCumulativeCorrect(prev => prev + targetText.length);

      // 문장 완료 시 백스페이스 수 오타 누적 및 리셋
      setTotalErrors(prev => prev + backspaceCount);
      setMaxErrorInCurrentSentence(0);
      setBackspaceCount(0);

      // 점수 계산 (대기실 설정 flawlessRate % 및 On/Off 활성화 여부 적용)
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
        if (!isTeacher) {
          const guest = getActiveGuestRoom();
          if (guest) {
            guest.sendProgress({
              currentIdx: nextIdx,
              progress: Math.floor((nextIdx / problemSet.length) * 100),
              combo: newCombo,
              score: totalScore,
              cpm,
              accuracy
            });
          }
        }
      } else {
        setCurrentIdx(problemSet.length);
        if (!isTeacher) {
          const guest = getActiveGuestRoom();
          if (guest) {
            guest.sendProgress({
              progress: 100,
              currentIdx: problemSet.length,
              combo: newCombo,
              score: totalScore,
              cpm,
              accuracy,
              completedAt: Date.now()
            });
          }
        }
        // 학생 브라우저 로컬스토리지에 완주 기록 안전 보관
        saveStudentRecord({
          cpm,
          accuracy,
          contentTitle: `${problemSet.length}문장 타자`,
          roomCode
        });
      }
    } else {
      // 불일치 시 오타 경고 가이드 노출
      setShowWarning(true);
      setIsError(true);
    }
  };

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => setIsComposing(false);

  // 4-1. 카운트다운 시작 트리거 및 똑딱이
  useEffect(() => {
    if (roomStatus === 'playing') {
      if (countdown === null && !countdownFinished) {
        setCountdown(3);
      }
    } else {
      setCountdown(null);
      setCountdownFinished(false);
    }
  }, [roomStatus, countdown, countdownFinished]);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      const timer = setTimeout(() => {
        setCountdown(null);
        setCountdownFinished(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 4-2. 카운트다운 종료 후 입력창 자동 포커싱
  useEffect(() => {
    if (countdownFinished && roomStatus === 'playing') {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [countdownFinished, roomStatus]);

  // 5. AI 로봇 시뮬레이션 인터벌 구동 (Ref를 사용해 클로저 해결)
  useEffect(() => {
    if (!isTeacher || problemSet.length === 0 || roomStatus !== 'playing' || !countdownFinished) return;
    const botInterval = setInterval(() => {
      if (!participantsRef.current) return;

      const botUpdatesList: any[] = [];
      let hasUpdates = false;

      participantsRef.current.forEach(p => {
        if (!p.isBot || (p.currentIdx || 0) >= problemSet.length) return;
        const currentIdx = p.currentIdx || 0;

        // 봇별 로컬 소수점 진행률 없으면 이전 값이나 0으로 초기화
        if (botProgressRef.current[p.id] === undefined) {
          botProgressRef.current[p.id] = p.progress || 0;
        }
        const currentBotProgress = botProgressRef.current[p.id];

        // 1. 문장 읽기 딜레이 계수 보정
        const sentenceStartThreshold = (currentIdx / problemSet.length) * 100;
        if (currentBotProgress <= sentenceStartThreshold + 0.3) {
          if (Math.random() > 0.4) return;
        }

        // 2. 난이도별 타수(CPM) 기준 로드
        const level = (p.botLevel || 'easy') as 'easy' | 'medium' | 'hard';
        const speeds = roomSettingsRef.current.botSpeeds || {};
        const rawSpeed = speeds[level] || (level === 'easy' ? 100 : level === 'medium' ? 220 : 400);

        const speedLimits = {
          easy: { min: 30, max: 150 },
          medium: { min: 151, max: 300 },
          hard: { min: 301, max: 500 }
        };
        const limit = speedLimits[level];
        const baseSpeed = Math.min(limit.max, Math.max(limit.min, rawSpeed));

        // 3. 리듬 계수
        const rhythm = 0.85 + Math.random() * 0.3;
        const targetCPM = baseSpeed * rhythm;

        const currentTargetText = problemSet[currentIdx] || "";
        const expectedStrokesPerSec = targetCPM / 60;
        const totalStrokesForSentence = currentTargetText.length * 3;
        const sentenceProgressStep = (expectedStrokesPerSec / totalStrokesForSentence) * (100 / problemSet.length);

        const nextProgress = Math.min(100, currentBotProgress + sentenceProgressStep);
        botProgressRef.current[p.id] = nextProgress;

        const sentenceThreshold = ((currentIdx + 1) / problemSet.length) * 100;

        if (nextProgress >= sentenceThreshold) {
          botProgressRef.current[p.id] = sentenceThreshold; // 다음 문장 천이 시 소수점 누적값 보정
          const botAccuracy = 85 + Math.floor(Math.random() * 14);
          const botScore = (p.score || 0) + Math.floor((currentTargetText.length * (botAccuracy / 100)) + (targetCPM / 67));

          botUpdatesList.push({
            id: p.id,
            progress: Math.floor(sentenceThreshold),
            currentIdx: currentIdx + 1,
            cpm: Math.min(limit.max, Math.max(limit.min, Math.floor(baseSpeed * (0.9 + Math.random() * 0.2)))),
            accuracy: botAccuracy,
            score: botScore,
            completedAt: p.completedAt || Date.now() // 봇 완주 타임스탬프 기록
          });
          hasUpdates = true;
        } else {
          botUpdatesList.push({
            id: p.id,
            progress: Math.floor(nextProgress), // 진행도 소수점 버림 처리
            cpm: Math.min(limit.max, Math.max(limit.min, Math.floor(baseSpeed * (0.8 + Math.random() * 0.4))))
          });
          hasUpdates = true;
        }
      });

      // 봇 업데이트는 로컬 상태에 반영 (1초 주기 sendBoard로 학생들에게 자동 방송)
      if (hasUpdates) {
        setParticipants(prev => {
          const map = new Map(prev.map(p => [p.id, p]));
          botUpdatesList.forEach(bot => {
            if (map.has(bot.id)) {
              map.set(bot.id, { ...map.get(bot.id), ...bot });
            }
          });
          return Array.from(map.values()).sort(sortByScoreDesc);
        });
      }
    }, 1000);
    return () => clearInterval(botInterval);
  }, [isTeacher, problemSet, roomCode, roomStatus, countdownFinished]);

  // 대시보드 스탯 카드 서브 컴포넌트
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
      {/* 상단 바 (로고 및 방코드, 학생용 스탯 통합) */}
      <div className="flex justify-between items-center bg-white py-2 px-4 rounded-[20px] border-4 border-black shadow-[4px_4px_0px_#000] mb-2 w-full gap-3">
        <TajaPangLogo size="sm" />

        {!isTeacher && (
          <div className="hidden md:flex flex-1 justify-center mx-6 gap-3">
            <StatCard label="현재 타수" value={Math.floor(cpm)} subLabel="타" color="text-indigo-600" bgColor="bg-[#FFDE4D]" rotation="-rotate-1" compact />
            <StatCard label="정확도" value={`${Math.floor(accuracy)}%`} color="text-emerald-600" bgColor="bg-[#FFB0B0]" rotation="rotate-1" compact />
            <StatCard label="무결점 성공" value={combo} subLabel="회" color="text-amber-600" bgColor="bg-[#BFF6C3]" rotation="-rotate-1" compact />
            <StatCard label="누적 점수" value={Math.floor(score).toLocaleString()} color="text-rose-600" bgColor="bg-[#E2F1AF]" rotation="rotate-1" compact />
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className={isTeacher ? "bg-[#FFF59D] border-4 border-black px-8 py-2.5 rounded-2xl text-center shadow-[4px_4px_0px_#000] leading-none flex items-center justify-center" : "bg-slate-100 border-4 border-black px-5 py-2 rounded-xl text-center leading-none shadow-[3px_3px_0px_#000]"}>
            {!isTeacher && <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-0.5">ROOM CODE</span>}
            <span className={isTeacher ? "text-2xl md:text-3xl font-black text-slate-900 tracking-wider" : "text-2xl font-black text-indigo-600 tracking-wider"}>{isTeacher ? "📢 방번호: " : ""}<span className={isTeacher ? "text-indigo-600 font-extrabold" : ""}>{roomCode}</span></span>
          </div>

          {/* 학생 전용 나가기 버튼 */}
          {!isTeacher && (
            <button
              onClick={handleLeaveRoom}
              className="bg-rose-500 hover:bg-rose-600 text-white border-4 border-black px-4 py-2 rounded-xl font-black text-sm shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">나가기</span>
            </button>
          )}
        </div>
      </div>

      {/* 교사 탭 유지 필수 안내 배너 (상시 노출) */}
      {isTeacher && (
        <div className="w-full bg-[#FFF9C4] border-4 border-black rounded-2xl px-5 py-2 shadow-[4px_4px_0px_#000] flex items-center justify-between gap-3 text-xs md:text-sm font-black text-slate-900 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="text-base animate-pulse">⚠️</span>
            <span>새로고침 또는 창 종료 시 게임이 종료됩니다. 본 게임이 완전히 끝날 때까지 브라우저 창을 유지해 주세요.</span>
          </div>
          <span className="hidden sm:inline-block bg-white border-2 border-black px-2.5 py-0.5 rounded-full text-[11px] font-black text-amber-900 shrink-0 shadow-[1px_1px_0px_#000]">
            🔒 창 유지 필수
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col p-1 gap-2.5 overflow-hidden">
        {isTeacher ? (
          roomStatus === 'finished' ? (
            /* 1. 교사용 게임 종료 결과 화면 */
            <div className="flex-grow flex flex-col items-center justify-center bg-white rounded-[32px] border-4 border-black p-8 shadow-[8px_8px_0px_#000] max-w-2xl mx-auto w-full my-6 text-center animate-in fade-in duration-500">
              <div className="text-5xl mb-4">🏆</div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">타자 레이싱 종료!</h2>
              <p className="text-slate-500 text-sm font-bold mb-6">학생들이 최종 미션을 완수했습니다.</p>

              {/* 최종 랭킹 */}
              <div className="w-full space-y-2 mb-8 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {[...participants].sort(sortByScoreDesc).slice(0, 5).map((p, idx) => (
                  <div key={`final-rank-${p.id || idx}`} className="flex items-center justify-between bg-slate-50 border-2 border-black p-3 rounded-xl shadow-[2px_2px_0px_#000]">
                    <span className="font-black text-slate-800">{idx + 1}등. {p.nickname || p.name || '학생'}</span>
                    <span className="font-black text-indigo-600 text-base">{Math.floor(p.score || 0).toLocaleString()}점 ({Math.floor(p.cpm || 0)}타)</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  const host = getActiveHostRoom();
                  if (host) {
                    host.sendEvent('RESET_ROOM', {});
                  }
                  router.push(`/room/${roomCode}`);
                }}
                className="bg-[#00F0FF] text-slate-900 border-4 border-black px-10 py-3.5 rounded-full font-black text-lg shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] active:scale-95 transition-all cursor-pointer"
              >
                🏠 대기실로 돌아가기
              </button>
            </div>
          ) : (
            /* 2. 교사용 실시간 대시보드 */
            <div className="grid grid-cols-4 gap-3 overflow-hidden h-[310px] shrink-0">
              <div className="col-span-3 bg-white rounded-[32px] border-4 border-black shadow-[8px_8px_0px_#000] p-5 flex flex-col overflow-hidden max-h-[310px]">
                <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">📊 실시간 통계 대시보드 <span className="text-xs font-bold text-slate-500">(교실 TV 최적화 화면)</span></h3>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setIsZoomedTrack(true)}
                      className="bg-[#FFF59D] hover:bg-[#FFE082] text-black text-xs px-4 py-2 border-2 border-black rounded-xl font-black shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                      title="트랙 크게 보기"
                    >
                      <span>🔍</span>
                      <span>중계 화면 크게 보기</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("게임을 즉시 종료하고 최종 결과 화면으로 이동하시겠습니까?")) {
                          setRoomStatus('finished');
                          const host = getActiveHostRoom();
                          if (host) {
                            host.end({ participants, status: 'finished' });
                          }
                        }
                      }}
                      className="bg-rose-500 text-white text-xs px-4 py-2 border-2 border-black rounded-xl font-black shadow-[2px_2px_0px_#000] hover:bg-rose-600 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
                    >
                      🛑 게임 종료
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[220px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pb-4">
                    {[...participants].sort(sortByScoreDesc).map((p, idx) => (
                      <div key={`p-card-${p.id || idx}-${idx}`} className="bg-white rounded-xl p-2.5 flex flex-col justify-between border-4 border-black shadow-[4px_4px_0px_#000] min-h-[90px] transition-all hover:translate-x-[1px] hover:translate-y-[1px]">
                        <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`w-6 h-6 rounded flex items-center justify-center font-black text-xs border-2 border-black ${idx < 3 ? 'bg-[#FFF59D] text-black shadow-[1.5px_1.5px_0px_#000]' : 'bg-slate-100 text-slate-500'}`}>{idx + 1}</span>
                            <span className="text-sm font-black text-slate-900 truncate">
                              {p.isBot ? (p.botLevel === 'easy' ? '🐢' : p.botLevel === 'medium' ? '🐇' : '🐆') : ''}
                              {p.nickname || p.name || '학생'}
                            </span>
                          </div>
                          {(p.combo || 0) > 0 && (
                            <span className="bg-[#FFF59D] border-2 border-black text-black px-1.5 py-0.5 rounded text-[8px] font-black animate-bounce-subtle">{p.combo}🔥 BONUS</span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-[11px] font-black text-center">
                          <div className="bg-slate-50 border-2 border-black py-0.5 rounded-md">
                            <span className="text-slate-400 text-[8px] block leading-none mb-0.5">진행</span>
                            <span className="leading-none">{Math.floor(p.progress || 0)}%</span>
                          </div>
                          <div className="bg-indigo-50/50 border-2 border-black py-0.5 rounded-md">
                            <span className="text-indigo-400 text-[8px] block leading-none mb-0.5">속도</span>
                            <span className="leading-none">{Math.floor(p.cpm || 0)}타</span>
                          </div>
                          <div className="bg-emerald-50/50 border-2 border-black py-0.5 rounded-md">
                            <span className="text-emerald-400 text-[8px] block leading-none mb-0.5">정확</span>
                            <span className="leading-none">{Math.floor(p.accuracy || 100)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 교사용 실시간 랭킹 (간격 압축 및 드래그 스크롤링 제한) */}
              <div className="bg-white rounded-[32px] border-4 border-black p-4 text-slate-950 flex flex-col gap-3 overflow-hidden shadow-[8px_8px_0px_#000] max-h-[310px]">
                <h3 className="text-xs font-black uppercase tracking-widest border-b-2 border-black pb-2 flex flex-col gap-1"><div className="flex items-center gap-1.5"><span>🏆 실시간 총점 순위</span><span className="text-[9px] font-bold text-slate-500 normal-case">(총점 기준)</span></div><span className="text-[8px] font-bold text-indigo-600 block leading-none">※ 점수 = 글자수/정확도/보너스 합산</span></h3>
                <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[210px]">
                  {participants.map((p, idx) => (
                    <div key={`rank-${p.id || idx}-${idx}`} className="bg-slate-50 p-2.5 rounded-xl flex items-center justify-between border-2 border-black shadow-[2px_2px_0px_#000]">
                      <span className="text-sm font-black truncate max-w-[130px]">{idx + 1}. {p.nickname || p.name || '학생'}</span>
                      <span className="text-sm font-black text-indigo-600">{Math.floor(p.score || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        ) : (
          /* 3. 학생용 플레이 및 결과창 화면 */
          <div className="flex-1 flex gap-2.5 overflow-hidden">
            <div className="flex-1 flex flex-col gap-2 relative">
              {/* 모바일 화면에서만 노출되는 스탯 카드 영역 (데스크톱은 상단 바 헤더로 통합) */}
              <div className="flex justify-center gap-1.5 md:hidden">
                <StatCard label="현재 타수" value={Math.floor(cpm)} subLabel="타" color="text-indigo-600" bgColor="bg-[#FFDE4D]" rotation="-rotate-1" />
                <StatCard label="정확도" value={`${Math.floor(accuracy)}%`} color="text-emerald-500" bgColor="bg-[#FFB0B0]" rotation="rotate-2" />
                <StatCard label="무결점 성공" value={combo} subLabel="회" color="text-amber-500" bgColor="bg-[#BFF6C3]" rotation="-rotate-2" />
                <StatCard label="누적 점수" value={Math.floor(score).toLocaleString()} color="text-rose-500" bgColor="bg-[#E2F1AF]" rotation="rotate-1" />
              </div>
              <div
                onClick={() => { if (currentIdx < problemSet.length && !isFinished) inputRef.current?.focus(); }}
                className="flex-1 max-h-[320px] bg-classroom-chalkboard rounded-[24px] border-[6px] border-black shadow-[6px_6px_0px_#000] p-4 md:p-5 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 opacity-10 bg-chalk-dust"></div>
                {/* 칠판 구석에 띄우는 백스페이스 누적 카운트 (이의제기 방지용) */}
                {!isFinished && problemSet.length > 0 && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-2.5 py-0.5 rounded-full border border-white/20 font-black text-[9px] shadow-[1px_1px_0px_#000] z-20 flex items-center gap-1 select-none">
                    <span>Backspace:</span>
                    <span className="bg-white text-red-600 px-1 rounded-sm text-[8px] leading-none py-0.5">{backspaceCount}</span>
                  </div>
                )}

                {/* 3, 2, 1, START! 카운트다운 오버레이 */}
                {countdown !== null && (
                  <div className="absolute inset-0 bg-black/75 z-40 flex flex-col items-center justify-center select-none pointer-events-none transition-all duration-300">
                    <div
                      key={`countdown-${countdown}`}
                      className={`text-7xl md:text-9xl font-black italic animate-bounce drop-shadow-[5px_5px_0px_#000] ${countdown === 3 ? 'text-red-500' :
                          countdown === 2 ? 'text-orange-500' :
                            countdown === 1 ? 'text-emerald-500' :
                              'text-yellow-300 scale-110'
                        }`}
                    >
                      {countdown === 0 ? "START!" : countdown}
                    </div>
                  </div>
                )}

                {isFinished && problemSet.length > 0 ? (
                  /* 학생 완주 후 처리부 (혼자 연습하기 및 대기 모달 리포트 열기) */
                  isPracticeMode ? (
                    <div className="w-full h-full flex flex-col justify-between p-1 z-10 relative">
                      {/* 이전 화면 돌아가기 단추 */}
                      <button
                        onClick={() => setIsPracticeMode(false)}
                        className="absolute top-0 right-0 bg-slate-900 text-white border-2 border-black px-3 py-1 rounded-xl font-black text-[10px] shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all cursor-pointer z-30"
                      >
                        ↩️ 이전 화면
                      </button>

                      <div className="text-center mt-5">
                        <span className="text-[9px] bg-amber-500/20 text-[#FFF59D] border border-amber-500/30 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest select-none">
                          🎮 혼자 연습 모드
                        </span>
                      </div>

                      {/* 실시간 텍스트 검증 */}
                      <div className="flex-grow flex items-center justify-center py-2">
                        <p className="text-xl md:text-2xl font-bold tracking-tight leading-snug flex flex-wrap justify-center gap-x-1 text-white text-center select-none">
                          {practiceText.split('').map((char, index) => {
                            let color = "text-white/20";
                            if (index < practiceInput.length) {
                              color = practiceInput[index] === char ? "text-amber-300" : "text-red-400";
                            }
                            if (char === ' ') {
                              return (
                                <span key={index} className={color}>
                                  {roomSettings.showSpace ? '␣' : '\u00A0'}
                                </span>
                              );
                            }
                            return (
                              <span key={index} className={color}>
                                {char}
                              </span>
                            );
                          })}
                          <span className={practiceInput.length === practiceText.length ? "text-[#FFE600] pl-1.5 animate-pulse font-black" : "text-white/10 pl-1.5 font-normal"}>
                            ↵
                          </span>
                        </p>
                      </div>

                      {/* 연습 전용 입력 단자 */}
                      <div className="w-full max-w-md mx-auto pb-2">
                        <input
                          type="text"
                          value={practiceInput}
                          onChange={handlePracticeInputChange}
                          onKeyDown={handlePracticeKeyDown}
                          className="w-full bg-black/40 text-[#FFE600] border-4 border-black px-4 py-2.5 rounded-2xl text-sm font-black focus:outline-none focus:ring-0 placeholder-white/20 select-none text-center shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)]"
                          placeholder="이곳에 문장을 치고 엔터를 누르세요"
                          autoFocus
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center z-10 text-white flex flex-col gap-3.5 items-center justify-center py-2">
                      <span className="text-2xl font-black text-[#FFF59D] drop-shadow-[2.5px_2.5px_0px_#000] animate-pulse">🏁 MISSION CLEAR!</span>
                      <p className="text-white/60 text-xs font-bold -mt-1.5 mb-1">학습 분석 리포트가 생성되었습니다.</p>

                      <div className="flex gap-4">
                        <button
                          onClick={() => setShowStudentReportModal(true)}
                          className="bg-[#00F0FF] text-slate-900 border-4 border-black px-5 py-2 rounded-full font-black text-xs shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] active:scale-95 transition-all cursor-pointer hover:bg-[#33f3ff]"
                        >
                          📊 결과 리포트 보기
                        </button>
                        <button
                          onClick={startPractice}
                          className="bg-[#FFDE4D] text-slate-900 border-4 border-black px-5 py-2 rounded-full font-black text-xs shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] active:scale-95 transition-all cursor-pointer hover:bg-[#ffe775]"
                        >
                          🎮 혼자 연습하기
                        </button>
                      </div>
                    </div>
                  )
                ) : (/* 학생 실시간 타이핑 중 */
                  <div className="w-full max-w-5xl xl:max-w-6xl z-10 space-y-3">
                    <p className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-snug flex flex-wrap justify-center gap-x-1 text-white text-center">
                      {(() => {
                        const delimIndex = targetText.indexOf(' - ');
                        const letters = targetText.split('').map((char, index) => {
                          let color = "text-white/20";
                          if (index < userInput.length) {
                            color = userInput[index] === char ? "text-amber-300" : "text-red-400";
                          }

                          // 구분자 ' - ' 기준 스타일 클래스 분기
                          let styleClass = "";
                          if (delimIndex !== -1) {
                            if (index < delimIndex) {
                              styleClass = index < userInput.length ? "font-black" : "font-black text-[#FFE600] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] bg-white/5 px-0.5 rounded";
                            } else if (index >= delimIndex && index < delimIndex + 3) {
                              styleClass = index < userInput.length ? "opacity-100" : "opacity-30 font-normal mx-0.5";
                            } else {
                              styleClass = index < userInput.length ? "opacity-100" : "opacity-70 font-medium text-slate-100";
                            }
                          }

                          const finalClass = index < userInput.length ? color : `${color} ${styleClass}`;

                          if (char === ' ') {
                            return (
                              <span key={index} className={finalClass}>
                                {roomSettings.showSpace ? '␣' : '\u00A0'}
                              </span>
                            );
                          }
                          return (
                            <span key={index} className={finalClass}>
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
                    <input
                      ref={inputRef}
                      type="text"
                      value={userInput}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      onCompositionStart={handleCompositionStart}
                      onCompositionEnd={handleCompositionEnd}
                      onBlur={(e) => {
                        if (currentIdx < problemSet.length && roomStatus === 'playing' && countdownFinished) {
                          setTimeout(() => e.target.focus(), 10);
                        }
                      }}
                      disabled={roomStatus === 'playing' && !countdownFinished}
                      className={`w-full bg-white/5 border-b-4 ${isError ? 'border-red-400' : 'border-white/10'} text-white text-3xl md:text-4xl p-3 md:p-4 outline-none focus:border-amber-300 transition-all text-center font-bold placeholder:opacity-5`}
                      placeholder={countdown !== null ? "카운트다운 완료 후 시작합니다!" : "여기에 입력하세요"}
                      autoFocus
                    />
                    {showWarning && (
                      <p className="text-red-400 text-lg font-black mt-2 text-center animate-bounce-subtle">
                        ⚠️ 문장이 일치하지 않습니다. 오타를 수정하고 엔터를 눌러주세요!
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 학생용 우측 실시간 랭킹 (5위 크기로 축소 및 스크롤) */}
            <div className="hidden lg:flex w-72 bg-[#BFF6C3] rounded-[24px] border-4 border-black p-3 text-black flex-col gap-2 overflow-hidden shadow-[4px_4px_0px_#000] max-h-[320px]">
              <h3 className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black pb-1.5 flex flex-col gap-1"><div className="flex items-center gap-1.5"><span>🏆 실시간 총점 순위</span><span className="text-[8px] font-bold text-slate-500 normal-case">(총점 기준)</span></div><span className="text-[8px] font-bold text-indigo-700 block leading-none">※ 점수 = 글자수/정확도/보너스 합산</span></h3>
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar max-h-[240px]">
                {participants.map((p, idx) => {
                  const isMe = p.id === myId;
                  return (
                    <div key={`student-rank-${p.id || idx}-${idx}`} className={`p-2 rounded-xl flex items-center justify-between border-2 border-black ${isMe ? 'bg-[#FFF59D] shadow-[2px_2px_0px_#000]' : 'bg-white shadow-[2px_2px_0px_#000]'}`}>
                      <span className="text-xs font-black truncate max-w-[120px]">{idx + 1}. {p.nickname || p.name || '학생'}</span>
                      <span className="text-xs font-black text-indigo-600">{Math.floor(p.score || 0).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 학생 종합 결과 리포트 오버레이 모달 (스크롤 차단 팝업 - 교사 제외 및 닫기 기능 탑재) */}
        {isFinished && problemSet.length > 0 && !isTeacher && showStudentReportModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-2xl bg-classroom-chalkboard rounded-[32px] border-[8px] border-black shadow-[12px_12px_0px_#000] p-5 md:p-6 flex flex-col justify-between relative overflow-hidden animate-in zoom-in duration-300">
              <div className="absolute inset-0 opacity-10 bg-chalk-dust"></div>

              {/* 모달 닫기 버튼 */}
              <button
                onClick={() => setShowStudentReportModal(false)}
                className="absolute top-4 right-4 bg-rose-500 hover:bg-rose-600 text-white w-8 h-8 rounded-full border-4 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all cursor-pointer z-30 animate-bounce-subtle"
                title="닫기"
              >
                ✕
              </button>

              <div className="text-center mb-4 z-10">
                <h2 className="text-3xl font-black text-[#FFF59D] drop-shadow-[2.5px_2.5px_0px_#000] tracking-wider">🏆 MISSION CLEAR!</h2>
                <p className="text-white text-[11px] opacity-80 mt-1 font-bold">학습 분석 리포트가 생성되었습니다.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 z-10 mb-4">
                {/* 종합 스탯 */}
                <div className="md:col-span-2 bg-[#FFDE4D] text-black border-4 border-black shadow-[3px_3px_0px_#000] rounded-[20px] p-3.5 flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 border-b-2 border-black pb-1 mb-2">📊 종합 타이핑 스탯</span>
                  <div className="grid grid-cols-2 gap-2.5 flex-1">
                    <div className="bg-white border-2 border-black rounded-lg p-2 flex flex-col justify-between shadow-[1.5px_1.5px_0px_#000]">
                      <span className="text-[8px] font-black text-slate-500">평균 속도</span>
                      <span className="text-xl font-black text-indigo-600 leading-none">{Math.floor(cpm)} <span className="text-[10px]">타/분</span></span>
                    </div>
                    <div className="bg-white border-2 border-black rounded-lg p-2 flex flex-col justify-between shadow-[1.5px_1.5px_0px_#000]">
                      <span className="text-[8px] font-black text-slate-500">최종 정확도</span>
                      <span className="text-xl font-black text-emerald-600 leading-none">{Math.floor(accuracy)}%</span>
                    </div>
                    <div className="bg-white border-2 border-black rounded-lg p-2 flex flex-col justify-between shadow-[1.5px_1.5px_0px_#000]">
                      <span className="text-[8px] font-black text-slate-500">무결점 성공</span>
                      <span className="text-xl font-black text-amber-600 leading-none">{combo}회</span>
                      <span className="text-[9px] font-bold text-slate-500 mt-1 leading-none">(지우기: {totalErrors}회)</span>
                    </div>
                    <div className="bg-white border-2 border-black rounded-lg p-2 flex flex-col justify-between shadow-[1.5px_1.5px_0px_#000]">
                      <span className="text-[8px] font-black text-slate-500">누적 획득 점수</span>
                      <span className="text-lg font-black text-rose-600 leading-none truncate">{Math.floor(score).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 순위 및 대기상태 */}
                <div className="flex flex-col gap-3">
                  <div className="flex-1 bg-[#FFB0B0] text-black border-4 border-black shadow-[3px_3px_0px_#000] rounded-[20px] p-3 flex flex-col justify-between min-h-[75px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 border-b-2 border-black pb-1.5">👑 최종 순위</span>
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-2xl font-black text-slate-900 leading-none">
                        {(() => {
                          const sorted = [...participants].sort(sortByScoreDesc);
                          const rank = sorted.findIndex(p => p.id === myId) + 1;
                          return rank > 0 ? `${rank}등` : '집계중';
                        })()}
                      </span>
                      <span className="text-[10px] text-slate-700 ml-1 font-black">/ {participants.length}명</span>
                    </div>
                  </div>

                  <div className="flex-1 bg-[#BFF6C3] text-black border-4 border-black shadow-[3px_3px_0px_#000] rounded-[20px] p-3 flex flex-col justify-between min-h-[75px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 border-b-2 border-black pb-1.5">📈 타속 기록</span>
                    <div className="flex-grow flex flex-col gap-1 justify-center px-1">
                      <div className="flex justify-between items-center text-xs font-black">
                        <span className="text-slate-600 text-[9px]">최고 타수:</span>
                        <span className="text-indigo-600 text-sm">{maxCpm} <span className="text-[8px]">타</span></span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-black">
                        <span className="text-slate-600 text-[9px]">최저 타수:</span>
                        <span className="text-rose-500 text-sm">{minCpm === 9999 ? 0 : minCpm} <span className="text-[8px]">타</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI 실시간 진단 */}
              <div className="bg-white text-black border-4 border-black shadow-[3px_3px_0px_#000] rounded-[20px] p-3 flex flex-col justify-between z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 border-b-2 border-black pb-1 mb-1.5">🤖 AI 실시간 타이핑 진단</span>
                <div className="text-[11px] font-bold text-slate-800 leading-relaxed">
                  {(() => {
                    if (totalKeystrokes === 0) return "💡 입력된 타이핑 데이터가 존재하지 않습니다. 문장을 완타하여 타이핑 분석 진단을 받아보세요!";
                    if (accuracy < 85) return "💡 오타율이 높은 편입니다. 정확한 자리 연습에 더 집중하면 타수가 비약적으로 상승할 수 있습니다! 천천히 치더라도 정확도를 90% 이상으로 유지해보세요.";
                    if (backspaceCount > totalKeystrokes * 0.15) return `💡 수정 키(Backspace) 입력 횟수(${backspaceCount}회)가 전체 입력 대비 높은 편입니다. 조급하게 치기보단 한 글자씩 확실히 누르는 연습이 효과적입니다!`;
                    if (cpm > 350) return `💡 대단합니다! 속도(${Math.floor(cpm)}타)와 정확도(${Math.floor(accuracy)}%) 모두 최상위 수준입니다. 리듬감을 유지하며 긴 문장 연습으로 지구력을 강화해보세요.`;
                    return "💡 훌륭한 타이핑 밸런스입니다! 속도와 정확도가 고르게 발달하고 있습니다. 오타가 전혀 없는 '무결점 보너스'를 늘리는 데 도전해보세요.";
                  })()}
                </div>
                <div className="flex gap-3.5 mt-1.5 pt-1.5 border-t border-slate-100 text-[9px] text-slate-500 font-black">
                  <span>총 키 입력: {totalKeystrokes}타</span>
                  <span>오타수: {totalErrors}회</span>
                  <span>지움(Backspace): {backspaceCount}회</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 레이싱 트랙 영역 (h-40 -> h-80 두 배 확장, 레인 분산 % 12, 2글자 닉네임 노출) */}
        {(() => {
          const shouldHideTrack = isTeacher ? hideTeacherTrackLocal : roomSettings?.hideStudentTrack;
          const totalParticipants = participants.length;
          const trackHeight = Math.min(450, Math.max(260, 120 + totalParticipants * 25));
          const roadLineCount = isTeacher ? 8 : Math.max(4, Math.min(8, Math.floor(trackHeight / 50)));
          return shouldHideTrack ? (
            <div className="bg-[#1e293b] p-4 rounded-[28px] border-4 border-black shadow-[6px_6px_0px_#000] h-20 flex items-center justify-center relative">
              <div className="flex items-center gap-3 text-slate-400 font-bold text-lg">
                <span>{isTeacher ? '🔒 교사 화면의 레이싱 트랙이 숨겨져 있습니다.' : '🔒 선생님이 실시간 레이싱 트랙을 가렸습니다.'}</span>
              </div>
              {isTeacher && (
                <button
                  onClick={() => setHideTeacherTrackLocal(false)}
                  className="absolute right-6 bg-[#FFF59D] text-black text-[10px] font-black px-4 py-1.5 border-2 border-black rounded-full shadow-[2px_2px_0px_#000] hover:bg-[#FFF176] transition-all cursor-pointer"
                >
                  👁️ 트랙 켜기
                </button>
              )}
            </div>
          ) : (
            <div
              className="bg-white p-3 rounded-[28px] border-4 border-black shadow-[8px_8px_0px_#000] flex flex-col overflow-hidden relative transition-all duration-300 w-full flex-1 min-h-[260px]"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-carbon-stripe opacity-30"></div>
              {isTeacher ? (
                /* 1. 교사용 전체 레이싱 트랙 (25명 풀 렌더링) */
                <div className="flex-1 bg-slate-100 rounded-2xl relative overflow-hidden border-2 border-black shadow-inner">
                  <div className="absolute inset-0 flex flex-col justify-around py-2 opacity-10">
                    {Array.from({ length: roadLineCount }).map((_, i) => (
                      <div key={i} className={`h-0.5 w-full flex gap-8 ${roomStatus === 'finished' ? '' : 'animate-road-flow'}`}>
                        {Array.from({ length: 20 }).map((_, j) => (
                          <div key={j} className="w-12 h-full bg-black rounded-full"></div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-10 z-10 flex items-center justify-center">
                    {/* 격자 무늬 배경만 투명도 20% 부여 */}
                    <div className="absolute inset-0 bg-[repeating-conic-gradient(#fff_0_90deg,#000_0_180deg)] bg-[length:20px_20px] opacity-20"></div>

                    {/* 안내 문구는 투명도 영향 없이 100% 뚜렷한 진한 검정색으로 노출 */}
                    <div className="relative text-[14px] font-black text-black leading-tight text-center select-none flex flex-col gap-1 items-center z-20">
                      <span>문</span>
                      <span>장</span>
                      <span>진</span>
                      <span>행</span>
                      <span>완</span>
                      <span>료</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 pr-12 pl-10">
                    {(() => {
                      const trackParticipants = [...participants].sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
                      return trackParticipants.map((p, idx) => {
                        const total = trackParticipants.length;
                        let verticalPos = 50;
                        if (total > 1) {
                          let start = 30;
                          let end = 70;
                          if (total > 16) {
                            start = 5;
                            end = 92;
                          } else if (total > 8) {
                            start = 10;
                            end = 87;
                          } else if (total > 3) {
                            start = 18;
                            end = 80;
                          }
                          verticalPos = start + (idx * (end - start)) / (total - 1);
                        }
                        const progressVal = Math.floor(p.progress || 0);
                        const offsetScale = Math.max(0, 1 - (progressVal / 100));
                        const horizontalOffset = ((idx % 8) * -16) * offsetScale;
                        const isMe = p.id === myId;
                        const carColor = CAR_COLORS[idx % CAR_COLORS.length];
                        let scaleClass = 'scale-100';
                        if (total > 18) scaleClass = 'scale-[0.80]';
                        else if (total > 12) scaleClass = 'scale-[0.88]';
                        else if (total > 6) scaleClass = 'scale-[0.93]';
                        const responsiveWidth = Math.max(34, Math.min(68, 80 - (total * 1.5)));

                        return (
                          <div key={`race-car-${p.id || idx}-${idx}`} className="absolute transition-all duration-1000 ease-out flex items-center" style={{ left: `calc(${progressVal}% + ${horizontalOffset}px)`, top: `${verticalPos}%`, transform: 'translate(-50%, -50%)', zIndex: isMe ? 50 : 20 }}>
                            <MiniCar color={isMe ? '#FFF59D' : carColor} nickname={formatNickname(p.nickname, p.name)} isMe={isMe} idx={idx} width={responsiveWidth} scaleClass={scaleClass} tooltipPosition={verticalPos < 25 ? 'bottom' : 'top'} />
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : (
                /* 2. 학생용 투트랙 레이싱 (3선 줌인 + 우측 세로 미니맵) */
                <div className="flex-1 flex gap-2 overflow-hidden h-full">
                  {/* 왼쪽: 메인 3선 줌인 트랙 */}
                  <div className="flex-grow flex-1 bg-slate-100 rounded-2xl relative overflow-hidden border-2 border-black shadow-inner">
                    <div className="absolute inset-0 flex flex-col justify-around py-4 opacity-10">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1 w-full flex gap-8 ${isFinished ? '' : 'animate-road-flow'}`}>
                          {Array.from({ length: 20 }).map((_, j) => (
                            <div key={j} className="w-12 h-full bg-black rounded-full"></div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-10 z-10 flex items-center justify-center">
                      {/* 격자 무늬 배경만 투명도 20% 부여 */}
                      <div className="absolute inset-0 bg-[repeating-conic-gradient(#fff_0_90deg,#000_0_180deg)] bg-[length:20px_20px] opacity-20"></div>

                      {/* 안내 문구는 투명도 영향 없이 100% 뚜렷한 진한 검정색으로 노출 */}
                      <div className="relative text-[14px] font-black text-black leading-tight text-center select-none flex flex-col gap-1 items-center z-20">
                        <span>문</span>
                        <span>장</span>
                        <span>진</span>
                        <span>행</span>
                        <span>완</span>
                        <span>료</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 pr-12 pl-10">
                      {(() => {
                        const rankedParticipants = [...participants].sort(sortByScoreDesc);

                        // 아직 완주하지 않고 주행 중인 라이벌 필터 (단, 나는 반드시 포함)
                        const runningParticipants = rankedParticipants.filter(p => (p.progress || 0) < 100 || p.id === myId);
                        const myIndexInRunning = runningParticipants.findIndex(p => p.id === myId);

                        let displayParticipants = [];

                        if (rankedParticipants.length <= 3) {
                          displayParticipants = rankedParticipants;
                        } else {
                          // 주행 중인 사람들 중에서 나를 중앙에 두는 윈도우 추출
                          let runningWindow = [];
                          if (runningParticipants.length <= 3) {
                            runningWindow = runningParticipants;
                          } else {
                            if (myIndexInRunning <= 0) {
                              runningWindow = runningParticipants.slice(0, 3);
                            } else if (myIndexInRunning >= runningParticipants.length - 1) {
                              runningWindow = runningParticipants.slice(runningParticipants.length - 3);
                            } else {
                              runningWindow = [
                                runningParticipants[myIndexInRunning - 1],
                                runningParticipants[myIndexInRunning],
                                runningParticipants[myIndexInRunning + 1]
                              ];
                            }
                          }

                          // 주행 윈도우가 3대 미만일 시, 전체 정렬 리스트에서 부족한 수만큼 백필(Backfill)하여 3차선 벌크를 보존
                          displayParticipants = [...runningWindow];
                          if (displayParticipants.length < 3) {
                            for (const p of rankedParticipants) {
                              if (displayParticipants.length >= 3) break;
                              if (!displayParticipants.some(x => x.id === p.id)) {
                                if ((p.progress || 0) >= 100) {
                                  displayParticipants.unshift(p); // 완주 차량은 트랙 상위 차선에 선배치
                                } else {
                                  displayParticipants.push(p);
                                }
                              }
                            }
                          }
                        }

                        const myRankInList = rankedParticipants.findIndex(x => x.id === myId);
                        const isLeader = myRankInList === 0;
                        const isChaser = rankedParticipants.length > 1 && myRankInList === rankedParticipants.length - 1;

                        return (
                          <>
                            {isLeader && (
                              <div className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 text-2xl font-black text-yellow-500/20 select-none pointer-events-none">
                                <span>👑 LEADER</span>
                              </div>
                            )}
                            {isChaser && (
                              <div className="absolute left-1/2 top-[80%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 text-2xl font-black text-rose-500/20 select-none pointer-events-none">
                                <span>🔥 CHASER</span>
                              </div>
                            )}
                            {rankedParticipants.map((p) => {
                              const isMe = p.id === myId;

                              // 등수 변동 시 차량 외형/색상 변형을 차단하기 위해 가입 시간 순 리스트를 기준으로 고정 인덱스 추출
                              const timeSortedList = [...participants].sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
                              const originalIdx = timeSortedList.findIndex(x => x.id === p.id);
                              const carColor = CAR_COLORS[originalIdx % CAR_COLORS.length];

                              const displayIdx = displayParticipants.findIndex(x => x.id === p.id);
                              const progressVal = Math.floor(p.progress || 0);
                              const offsetScale = Math.max(0, 1 - (progressVal / 100));

                              let verticalPos = 50;
                              let opacityVal = 0;
                              let leftStyle = '';
                              let scaleClass = 'scale-[0.88]';

                              // 상대적 랭킹 기반 차선 매핑 (내 차는 항상 가운데 50%, 앞 차량은 위 20%, 뒤 차량은 아래 80%)
                              let laneIdx = 1;
                              if (!isMe) {
                                const myPosInList = rankedParticipants.findIndex(x => x.id === p.id);
                                const myRankInList = rankedParticipants.findIndex(x => x.id === myId);
                                if (myPosInList < myRankInList) {
                                  laneIdx = 0; // 위 차선 (20%)
                                } else {
                                  laneIdx = 2; // 아래 차선 (80%)
                                }
                              }
                              const verticalPositions = [20, 50, 80];
                              verticalPos = verticalPositions[laneIdx];

                              const pRank = rankedParticipants.findIndex(x => x.id === p.id);
                              if (displayIdx !== -1 && (isMe || pRank === myRankInList - 1 || pRank === myRankInList + 1)) {
                                // 1. 활성 윈도우 참가자: 부드러운 노출
                                opacityVal = 1;
                                if (isMe) scaleClass = 'scale-110';
                              } else {
                                // 2. 비활성 참가자: 자연스러운 제자리 페이드아웃을 위해 opacity만 0으로 처리
                                opacityVal = 0;
                              }

                              const horizontalOffset = ((laneIdx % 3) * -16) * offsetScale;
                              leftStyle = `calc(${progressVal}% + ${horizontalOffset}px)`;

                              return (
                                <div
                                  key={`zoom-car-${p.id}`}
                                  className="absolute flex items-center"
                                  style={{
                                    left: leftStyle,
                                    top: `${verticalPos}%`,
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: isMe ? 50 : 20, transitionProperty: 'left, opacity', transitionDuration: '1000ms, 400ms', transitionTimingFunction: 'ease-out',
                                    opacity: opacityVal,
                                    pointerEvents: opacityVal === 0 ? 'none' : 'auto'
                                  }}
                                >
                                  <MiniCar
                                    color={carColor}
                                    nickname={formatNickname(p.nickname, p.name)}
                                    isMe={isMe}
                                    idx={originalIdx}
                                    width={80}
                                    scaleClass={scaleClass}
                                    tooltipPosition={verticalPos < 25 ? 'bottom' : 'top'}
                                  />
                                </div>
                              );
                            })}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 우측 미니맵 */}
                  <div className="w-12 flex flex-col items-center justify-between border-l-4 border-black/10 pl-2 py-2 relative h-full">
                    <div className="w-2.5 bg-slate-300 rounded-full h-full relative border-2 border-black shadow-inner">
                      <div className="absolute top-0 bottom-0 left-0 right-0 bg-slate-400 opacity-20 bg-[repeating-linear-gradient(0deg,#fff,#fff_4px,transparent_4px,transparent_8px)] rounded-full"></div>
                      {participants.map((p, idx) => {
                        const isMe = p.id === myId;
                        const progressVal = Math.min(94, Math.max(6, p.progress || 0));
                        // 등수 변동 시 미니맵 점 색상 변형을 차단하기 위해 가입 시간 순 기준 고정 인덱스 및 색상 추출
                        const timeSortedListForDot = [...participants].sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
                        const originalIdxForDot = timeSortedListForDot.findIndex(x => x.id === p.id);
                        const carColor = CAR_COLORS[originalIdxForDot % CAR_COLORS.length];

                        const total = participants.length;
                        const horizontalOffset = total > 1 ? Math.max(-10, Math.min(10, (idx - (total - 1) / 2) * 2.5)) : 0;

                        return (
                          <div
                            key={`minimap-dot-${p.id || idx}`}
                            style={{
                              bottom: `${progressVal}%`,
                              left: `calc(50% + ${horizontalOffset}px)`,
                              transform: 'translateX(-50%)'
                            }}
                            className={`absolute w-4 h-4 rounded-full border-2 border-black flex items-center justify-center transition-all duration-1000 ease-out z-10 ${isMe ? 'bg-yellow-300 scale-125 ring-2 ring-amber-500 animate-pulse' : 'bg-white'
                              }`}
                          >
                            {isMe ? (
                              <span className="text-[7px] font-black text-amber-800 leading-none">나</span>
                            ) : (
                              <div style={{ backgroundColor: carColor }} className="w-1.5 h-1.5 rounded-full"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        
        {/* 25인 레이싱 트랙 팝업 모달 */}
        {isZoomedTrack && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm p-6 flex flex-col items-center justify-center">
            <div className="w-full h-full max-w-[96vw] max-h-[94vh] bg-white rounded-[32px] border-4 border-black shadow-[10px_10px_0px_#000] p-6 flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* 팝업 헤더 */}
              <div className="flex justify-between items-center mb-4 border-b-4 border-black pb-2.5 shrink-0">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">🏆 실시간 레이싱 중계 화면 <span className="text-xs font-bold text-slate-500">(전체 화면 모드)</span></h3>
                <button
                  onClick={() => setIsZoomedTrack(false)}
                  className="bg-rose-500 hover:bg-rose-600 text-white text-xs px-4 py-2 border-2 border-black rounded-xl font-black shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-pointer flex items-center gap-1"
                >
                  ✕ 닫기 (축소하기)
                </button>
              </div>

              {/* 팝업용 거대 레이싱 트랙 */}
              <div className="flex-1 bg-slate-100 rounded-2xl relative overflow-hidden border-2 border-black shadow-inner">
                {/* 도로 가이드 라인 (팝업에 맞게 12줄로 가이드라인 증량 배치) */}
                <div className="absolute inset-0 flex flex-col justify-around py-4 opacity-10">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className={`h-0.5 w-full flex gap-8 ${roomStatus === 'finished' ? '' : 'animate-road-flow'}`}>
                      {Array.from({ length: 20 }).map((_, j) => (
                        <div key={j} className="w-12 h-full bg-black rounded-full"></div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* 도착 격자선 */}
                <div className="absolute right-0 top-0 bottom-0 w-16 z-10 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[repeating-conic-gradient(#fff_0_90deg,#000_0_180deg)] bg-[length:32px_32px] opacity-20"></div>
                  <div className="relative text-xl font-black text-black leading-tight text-center select-none flex flex-col gap-1.5 items-center z-20">
                    <span>문</span>
                    <span>장</span>
                    <span>진</span>
                    <span>행</span>
                    <span>완</span>
                    <span>료</span>
                  </div>
                </div>

                {/* 차량 주행 영역 */}
                <div className="absolute inset-0 pr-20 pl-12">
                  {(() => {
                    const trackParticipants = [...participants].sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
                    return trackParticipants.map((p, idx) => {
                      const total = trackParticipants.length;
                      let verticalPos = 50;
                      if (total > 1) {
                        let start = 8;
                        let end = 92;
                        verticalPos = start + (idx * (end - start)) / (total - 1);
                      }
                      const progressVal = Math.floor(p.progress || 0);
                      const offsetScale = Math.max(0, 1 - (progressVal / 100));
                      const horizontalOffset = ((idx % 8) * -20) * offsetScale;
                      const isMe = false; // 교사용이므로 나 자신 차량 강조 없음
                      const carColor = CAR_COLORS[idx % CAR_COLORS.length];
                      
                      // 팝업에서는 화면이 매우 크므로 차량 스케일도 시원하게 키워줌
                      const responsiveWidth = Math.max(48, Math.min(84, 94 - (total * 1.5)));
                      const scaleClass = total > 18 ? 'scale-[0.88]' : 'scale-100';

                      return (
                        <div 
                          key={`race-car-zoom-${p.id || idx}-${idx}`} 
                          className="absolute transition-all duration-1000 ease-out flex items-center" 
                          style={{ 
                            left: `calc(${progressVal}% + ${horizontalOffset}px)`, 
                            top: `${verticalPos}%`, 
                            transform: 'translate(-50%, -50%)', 
                            zIndex: 20 
                          }}
                        >
                          <MiniCar 
                            color={carColor} 
                            nickname={formatNickname(p.nickname, p.name)} 
                            isMe={isMe} 
                            idx={idx} 
                            width={responsiveWidth} 
                            scaleClass={scaleClass} 
                            tooltipPosition={verticalPos < 25 ? 'bottom' : 'top'} 
                          />
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 연결 실패 / 방 종료 시 싱글 모드(혼자 하기) 전환 모달 (수업 중단 방지) */}
      {showFallbackModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex flex-col justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border-4 border-black p-6 md:p-8 rounded-[40px] shadow-[8px_8px_0px_#000] text-center max-w-md w-full transform animate-in zoom-in-95 duration-200 space-y-5">
            <div className="text-5xl">🛡️</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">수업 중단 방지 안내</h3>
              <p className="text-sm font-extrabold text-rose-600 leading-relaxed bg-rose-50 p-3 rounded-xl border-2 border-rose-200">
                {fallbackReason}
              </p>
              <p className="text-xs font-bold text-slate-600 leading-relaxed">
                네트워크 연결이 종료되었지만 수업을 멈추지 않고 계속할 수 있습니다.<br />
                지금까지 연습하던 지문으로 <strong>혼자 하기(싱글 모드)</strong>로 전환하시겠습니까?
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  router.push('/practice/play');
                }}
                className="w-full py-3.5 bg-[#FFE600] text-slate-950 font-black text-lg rounded-2xl border-3 border-black shadow-[4px_4px_0px_#000] hover:bg-[#FFD600] active:translate-y-[2px] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>혼자 하기(싱글 모드)로 계속하기</span>
                <span>🚀</span>
              </button>
              <button
                onClick={() => router.push('/?view=join')}
                className="w-full py-2.5 bg-slate-100 text-slate-700 font-black text-sm rounded-xl border-2 border-black hover:bg-slate-200 transition-all cursor-pointer"
              >
                홈 화면으로 나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
