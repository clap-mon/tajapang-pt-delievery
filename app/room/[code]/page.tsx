"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import TajaPangLogo from '../../components/TajaPangLogo';
import { QRCodeSVG } from 'qrcode.react';
import {
  HostRoom,
  GuestRoom,
  getActiveHostRoom,
  setActiveHostRoom,
  getActiveGuestRoom,
  setActiveGuestRoom
} from '@/src/net/room';
import { appAlert, appConfirm, blockReloadKeys } from '@/lib/appDialog';

const ContentSelector = dynamic(() => import('./components/ContentSelector'), {
  ssr: false,
  loading: () => <div className="text-center font-black text-slate-500 py-10">꾸러미 선택기를 불러오는 중...</div>
});

interface Participant {
  id: string;
  nickname: string;
  joinedAt: number;
  isReady: boolean;
  score?: number;
  progress?: number;
  completedAt?: number;
  accuracy?: number;
  cpm?: number;
  emoji?: string;
  isBot?: boolean;
  botLevel?: 'easy' | 'medium' | 'hard';
}

export default function RoomLobby() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.code as string;
  const [displayRoomCode, setDisplayRoomCode] = useState(roomCode);

  useEffect(() => {
    setDisplayRoomCode(roomCode);
  }, [roomCode]);

  const isStartingGameRef = useRef(false);
  const isNavigatingRef = useRef(false);
  const hostRoomRef = useRef<HostRoom | null>(null);
  const guestRoomRef = useRef<GuestRoom | null>(null);

  const [roomStatus, setRoomStatus] = useState<'waiting' | 'preparing' | 'playing'>('waiting');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [nickname, setNickname] = useState('');
  const [isTeacher, setIsTeacher] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);

  // 싱글 모드(혼자 하기) 전환 모달 관련 상태
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [fallbackReason, setFallbackReason] = useState('');

  const [botSpeeds, setBotSpeeds] = useState({ easy: 150, medium: 300, hard: 500 });
  const [comboWeight, setComboWeight] = useState(50);
  const [enableFlawlessBonus, setEnableFlawlessBonus] = useState(true);
  const [showSpace, setShowSpace] = useState(false);
  const [removePunctuation, setRemovePunctuation] = useState(false);
  const [hideStudentTrack, setHideStudentTrack] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setInviteLink(`${window.location.origin}/?code=${displayRoomCode}`);
    }
  }, [displayRoomCode]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage('');
    }, 2000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // 안전한 클립보드 복사 헬퍼
  const copyToClipboard = async (text: string, successMsg: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setToastMessage(successMsg);
        return;
      }
    } catch (err) {
      console.warn('Clipboard writeText failed, trying fallback:', err);
    }
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setToastMessage(successMsg);
    } catch (e) {
      console.error('Copy fallback failed:', e);
      setToastMessage('복사에 실패했습니다. 수동으로 복사해 주세요.');
    }
  };

  // 1. 새로고침/탭 닫기 방지 경고 (선생님 전용)
  useEffect(() => {
    const isTeacherUser = sessionStorage.getItem('tajapang_is_teacher') === 'true';
    if (!isTeacherUser) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isStartingGameRef.current) return;
      e.preventDefault();
      e.returnValue = '페이지를 벗어나면 대기방이 사라지고 접속한 학생들이 모두 퇴장합니다. 정말 이동하시겠습니까?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    const unblockReloadKeys = blockReloadKeys('새로고침하면 방이 사라지고 학생들의 접속이 끊겨요. 새로고침을 막았습니다.');
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unblockReloadKeys();
    };
  }, []);

  // 2. PeerJS 통신 모듈 초기화 (호스트 / 게스트)
  useEffect(() => {
    if (!roomCode) return;

    const storedNickname = sessionStorage.getItem('tajapang_nickname') || '익명';
    const isTeacherUser = sessionStorage.getItem('tajapang_is_teacher') === 'true';

    setNickname(storedNickname);
    setIsTeacher(isTeacherUser);

    const EMOJIS = [
      '🐶', '🐱', '🦁', '🐯', '🦊', '🐻', '🐼', '🐨', '🐰', '🐹',
      '🐭', '🐸', '🐷', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅',
      '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌',
      '🐞', '🐜', '🦟', '🐢', '🐍', '🐙', '🦑', '🦞', '🦀', '🐡',
      '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐆', '🐅', '🦍'
    ];
    let myEmoji = sessionStorage.getItem('tajapang_emoji');
    if (!myEmoji) {
      myEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      sessionStorage.setItem('tajapang_emoji', myEmoji);
    }

    if (isTeacherUser) {
      // ============================================
      // [교사/호스트 모드]
      // ============================================
      let host = getActiveHostRoom();
      if (!host || host.code !== roomCode) {
        host = new HostRoom({
          gameName: 'tajapang',
          onReady: (code) => {
            console.log(`[Host] 방 개설 완료 (코드: ${code})`);
            setIsConnected(true);
            if (code && code !== roomCode) {
              setDisplayRoomCode(code);
              router.replace(`/room/${code}`);
            }
          },
          onStudentJoin: (student) => {
            console.log(`[Host] 학생 입장: ${student.nickname} (${student.peerId})`);
            setParticipants(prev => {
              const existingIdx = prev.findIndex(p => p.id === student.peerId);
              const newEntry: Participant = {
                id: student.peerId,
                nickname: student.nickname,
                joinedAt: student.joinedAt,
                isReady: true,
                emoji: EMOJIS[Math.abs(student.peerId.charCodeAt(0) || 0) % EMOJIS.length],
                progress: 0,
                cpm: 0,
                accuracy: 100
              };
              if (existingIdx !== -1) {
                const next = [...prev];
                next[existingIdx] = newEntry;
                return next;
              }
              return [...prev, newEntry];
            });
          },
          onStudentLeave: (peerId) => {
            console.log(`[Host] 학생 퇴장: ${peerId}`);
            setParticipants(prev => prev.filter(p => p.id !== peerId));
          },
          onError: (err) => {
            console.error('[Host] 에러:', err);
            appAlert(`방 생성 오류: ${err.message || '네트워크 상태를 확인해주세요.'}`);
          }
        });
        setActiveHostRoom(host);
        host.init(roomCode);
      } else {
        // 이미 있는 호스트면 기존 접속 학생들로 participants 복원 (봇도 유지)
        const restoredStudents: Participant[] = [];
        if (host.students) {
          host.students.forEach((student: any, peerId: string) => {
            restoredStudents.push({
              id: peerId,
              nickname: student.nickname,
              joinedAt: student.joinedAt || Date.now(),
              isReady: true,
              emoji: EMOJIS[Math.abs(peerId.charCodeAt(0) || 0) % EMOJIS.length],
              progress: 0,
              cpm: 0,
              accuracy: 100
            });
          });
        }
        setParticipants(prev => {
          const existingBots = prev.filter(p => p.id?.startsWith('bot-') || (p as any).isBot);
          return [...restoredStudents, ...existingBots];
        });

        // 이미 있는 호스트면 콜백만 갱신
        host.updateCallbacks({
          onStudentJoin: (student) => {
            setParticipants(prev => {
              const existingIdx = prev.findIndex(p => p.id === student.peerId);
              const newEntry: Participant = {
                id: student.peerId,
                nickname: student.nickname,
                joinedAt: student.joinedAt,
                isReady: true,
                emoji: EMOJIS[Math.abs(student.peerId.charCodeAt(0) || 0) % EMOJIS.length],
                progress: 0,
                cpm: 0,
                accuracy: 100
              };
              if (existingIdx !== -1) {
                const next = [...prev];
                next[existingIdx] = newEntry;
                return next;
              }
              return [...prev, newEntry];
            });
          },
          onStudentLeave: (peerId) => {
            setParticipants(prev => prev.filter(p => p.id !== peerId));
          }
        });
        setIsConnected(true);
      }
      hostRoomRef.current = host;
    } else {
      // ============================================
      // [학생/게스트 모드]
      // ============================================
      let guest = getActiveGuestRoom();
      if (!guest || guest.code !== roomCode) {
        guest = new GuestRoom({
          gameName: 'tajapang',
          code: roomCode,
          nickname: storedNickname,
          onJoined: (data) => {
            console.log('[Guest] 방 입장 성공:', data);
            setIsConnected(true);
            if (data?.currentCount) {
              setParticipantCount(data.currentCount);
            }
            setParticipants([{
              id: 'me',
              nickname: data.nickname || storedNickname,
              joinedAt: Date.now(),
              isReady: true,
              emoji: myEmoji!,
              progress: 0,
              cpm: 0,
              accuracy: 100
            }]);
          },
          onMessage: (payload) => {
            if (payload?.type === 'room_count' && typeof payload?.data?.count === 'number') {
              setParticipantCount(payload.data.count);
            }
          },
          // 10초 타임아웃 또는 연결 불가 시 onFail 호출 -> 싱글 모드 전환 버튼 표시
          onFail: (err) => {
            console.warn('[Guest] onFail 발생:', err);
            setFallbackReason('선생님 방에 연결할 수 없습니다. (10초 타임아웃 또는 방 미존재)');
            setShowFallbackModal(true);
          },
          // 교사 탭 종료 시 onHostLost 호출 -> 싱글 모드 전환 버튼 표시
          onHostLost: (err) => {
            console.warn('[Guest] onHostLost 발생:', err);
            setFallbackReason('선생님과의 연결이 종료되었습니다.');
            setShowFallbackModal(true);
          },
          onKick: (reason) => {
            appAlert(reason || '방장에 의해 내보내졌습니다.');
            router.push('/?view=join');
          },
          // 교사가 start 메시지 보냈을 때 지문과 3초 카운트다운을 수신하고 인게임으로 이동
          onStart: (data) => {
            console.log('[Guest] 게임 시작 신호 수신:', data);
            if (!isNavigatingRef.current) {
              isNavigatingRef.current = true;
              isStartingGameRef.current = true;
              sessionStorage.setItem('tajapang_start_data', JSON.stringify(data));
              router.push(`/room/${roomCode}/play`);
            }
          }
        });
        setActiveGuestRoom(guest);
        guest.connect();
      } else {
        if (guest.hasJoined) {
          setParticipants([{
            id: 'me',
            nickname: guest.nickname || storedNickname,
            joinedAt: Date.now(),
            isReady: true,
            emoji: myEmoji!,
            progress: 0,
            cpm: 0,
            accuracy: 100
          }]);
        }
        guest.updateCallbacks({
          onJoined: (data) => {
            setIsConnected(true);
            if (data?.currentCount) {
              setParticipantCount(data.currentCount);
            }
            setParticipants([{
              id: 'me',
              nickname: data?.nickname || guest?.nickname || storedNickname,
              joinedAt: Date.now(),
              isReady: true,
              emoji: myEmoji!,
              progress: 0,
              cpm: 0,
              accuracy: 100
            }]);
          },
          onMessage: (payload) => {
            if (payload?.type === 'room_count' && typeof payload?.data?.count === 'number') {
              setParticipantCount(payload.data.count);
            }
          },
          onFail: (err) => {
            setFallbackReason('선생님 방에 연결할 수 없습니다.');
            setShowFallbackModal(true);
          },
          onHostLost: (err) => {
            setFallbackReason('선생님과의 연결이 종료되었습니다.');
            setShowFallbackModal(true);
          },
          onKick: (reason) => {
            appAlert(reason || '방장에 의해 내보내졌습니다.');
            router.push('/?view=join');
          },
          onStart: (data) => {
            if (!isNavigatingRef.current) {
              isNavigatingRef.current = true;
              isStartingGameRef.current = true;
              sessionStorage.setItem('tajapang_start_data', JSON.stringify(data));
              router.push(`/room/${roomCode}/play`);
            }
          }
        });
        setIsConnected(true);
      }
      guestRoomRef.current = guest;
    }
  }, [roomCode, router]);

  // 교사: 참가자 변동 시 연결된 학생들에게 실시간 참가 인원 수 방송
  useEffect(() => {
    if (!isTeacher) return;
    const host = hostRoomRef.current || getActiveHostRoom();
    if (host && participants.length > 0) {
      host.broadcast('room_count', { count: participants.length });
    }
  }, [isTeacher, participants.length]);

  const students = participants;

  // 교사: 지문 고르기 단계(preparing) 진입
  const handleStartGame = async () => {
    if (!isTeacher) return;
    setRoomStatus('preparing');
  };

  // 교사: AI 봇 추가 (로컬 가상 참가자)
  const handleAddBot = (level: 'easy' | 'medium' | 'hard') => {
    if (!isTeacher) return;
    if (students.length >= 25) return appAlert('최대 정원(25명)이 찼습니다.');

    const botId = `bot_${Math.random().toString(36).substring(2, 7)}`;
    const botNames = {
      easy: '초급봇',
      medium: '중급봇',
      hard: '고급봇'
    };

    const botCount = participants.filter((p: any) => p.isBot && p.botLevel === level).length;
    const botNickname = `${botNames[level]} ${botCount + 1}`;

    const botData: Participant = {
      id: botId,
      nickname: botNickname,
      joinedAt: Date.now(),
      isReady: true,
      isBot: true,
      botLevel: level,
      progress: 0,
      cpm: 0,
      accuracy: 100
    };

    setParticipants(prev => [...prev, botData]);
  };

  const updateBotSpeed = (level: 'easy' | 'medium' | 'hard', speed: number) => {
    if (!isTeacher) return;
    const limits = {
      easy: { min: 0, max: 200 },
      medium: { min: 201, max: 400 },
      hard: { min: 401, max: 800 }
    };
    const { min, max } = limits[level];
    const validatedSpeed = Math.min(max, Math.max(min, speed));
    setBotSpeeds(prev => ({ ...prev, [level]: validatedSpeed }));
  };

  // 학생 내보내기(강퇴) 버튼
  const removeParticipant = (id: string) => {
    if (!isTeacher) return;
    const host = hostRoomRef.current || getActiveHostRoom();
    if (host) {
      host.kick(id, '선생님에 의해 대기실에서 내보내졌습니다.');
    }
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  // 교사: 지문 선택 완료 후 시작 처리
  const handleStartMultiplayer = (gameData: any) => {
    if (!isTeacher) return;
    const host = hostRoomRef.current || getActiveHostRoom();
    if (host) {
      // 봇 목록도 gameData에 포함시켜 전달
      const bots = participants.filter(p => p.isBot);
      const payload = {
        ...gameData,
        bots,
        botSpeeds
      };
      // start 메시지 브로드캐스트 (지문 + 3초 카운트다운)
      host.start(payload, 3);
      sessionStorage.setItem('tajapang_start_data', JSON.stringify({
        passage: payload,
        countdown: 3,
        startedAt: Date.now() + 3000
      }));

      isStartingGameRef.current = true;
      isNavigatingRef.current = true;
      router.push(`/room/${roomCode}/play`);
    }
  };

  if (roomStatus === 'waiting') {
    return (
      <main className="min-h-screen bg-[#FFF59D] p-3 md:p-4 flex flex-col justify-center">
        <div className="max-w-6xl mx-auto space-y-3.5 w-full">
          {/* 헤더 섹션 */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-[28px] border-4 border-black shadow-[8px_8px_0px_#000] animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-center gap-6 w-full flex-1 justify-between">
              <TajaPangLogo size="md" />

              {/* 접속 방 코드 중앙 대형 보드화 */}
              <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4 w-full sm:border-x-4 sm:border-black sm:mx-6 sm:px-6 py-0.5">
                <div className="text-center sm:text-left">
                  <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-0.5 leading-none">접속 방 코드</h2>
                  <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-nowrap">
                    <span className="font-['Noto_Sans_KR',sans-serif] text-4xl sm:text-5xl md:text-6xl font-black text-indigo-600 tracking-wider leading-none select-all">
                      {displayRoomCode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(displayRoomCode, '방코드가 복사되었습니다! 📋')}
                      title="코드 복사"
                      className="bg-white text-black p-1.5 rounded-lg border-2 border-black hover:bg-slate-100 active:translate-y-[1px] transition-all cursor-pointer shadow-[2px_2px_0px_#000] text-sm leading-none flex items-center justify-center w-8 h-8 shrink-0"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => copyToClipboard(inviteLink, '초대 링크가 복사되었습니다! 🔗')}
                      title="초대 링크 복사"
                      className="bg-white text-black p-1.5 rounded-lg border-2 border-black hover:bg-slate-100 active:translate-y-[1px] transition-all cursor-pointer shadow-[2px_2px_0px_#000] text-xs font-bold leading-none flex items-center justify-center gap-1 h-8 px-2 shrink-0"
                    >
                      🔗 링크 복사
                    </button>
                    <button
                      onClick={() => setShowQrModal(true)}
                      title="QR코드 보기"
                      className="bg-white text-black p-1.5 rounded-lg border-2 border-black hover:bg-slate-100 active:translate-y-[1px] transition-all cursor-pointer shadow-[2px_2px_0px_#000] text-xs font-bold leading-none flex items-center justify-center gap-1 h-8 px-2 shrink-0"
                    >
                      📱 QR코드
                    </button>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const confirmMsg = isTeacher
                      ? '🚨 주의: 모든 학생의 게임이 즉시 종료됩니다!\n\n선생님이 나가시면 참여 중인 모든 학생의 접속이 끊어지고 방이 사라집니다.\n정말 방을 종료하고 나가시겠습니까?'
                      : '대기방을 나가 초기 로그인 화면으로 돌아가시겠습니까?';
                    if (await appConfirm(confirmMsg)) {
                      if (isTeacher) {
                        const host = hostRoomRef.current || getActiveHostRoom();
                        if (host) {
                          host.end({ status: 'finished', reason: '선생님이 방을 종료했습니다.' });
                          setTimeout(() => {
                            host.destroy();
                            setActiveHostRoom(null);
                          }, 300);
                        }
                      } else {
                        guestRoomRef.current?.destroy();
                        setActiveGuestRoom(null);
                      }
                      setLoading(true);
                      setTimeout(() => {
                        router.push('/?view=join');
                      }, isTeacher ? 350 : 0);
                    }
                  }}
                  className="bg-rose-500 text-white text-sm px-6 py-2.5 rounded-xl border-4 border-black hover:bg-rose-600 hover:-translate-y-0.5 transition-all font-black cursor-pointer shadow-[3px_3px_0px_#000] active:translate-y-0 active:shadow-[1px_1px_0px_#000]"
                >
                  🚪 나가기
                </button>
              </div>
            </div>

            {/* 참가 현황 수치 */}
            <div className="text-center md:text-right bg-[#00F0FF] px-8 py-3 rounded-[20px] border-4 border-black shadow-[4px_4px_0px_#000] min-w-[150px]">
              <p className="text-slate-900 font-black text-sm uppercase tracking-widest mb-1.5">
                {isTeacher ? '대기 학생' : '참가 인원'}
              </p>
              <p className="text-3xl font-black text-slate-900 leading-none">
                {isTeacher ? students.length : participantCount}{' '}
                <span className="text-sm font-bold text-slate-800">
                  {isTeacher ? '/ 25' : '명 참가 중'}
                </span>
              </p>
            </div>
          </div>

          {/* 교사 탭 유지 필수 안내 배너 (상시 노출) */}
          {isTeacher && (
            <div className="w-full bg-[#FFF9C4] border-4 border-black rounded-[22px] px-5 py-2.5 shadow-[5px_5px_0px_#000] flex items-center justify-between gap-3 text-xs md:text-sm font-black text-slate-900 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <span className="text-base animate-pulse">⚠️</span>
                <span>새로고침 또는 창 종료 시 게임이 종료됩니다. 본 게임이 완전히 끝날 때까지 브라우저 창을 유지해 주세요.</span>
              </div>
              <span className="hidden sm:inline-block bg-white border-2 border-black px-2.5 py-0.5 rounded-full text-[11px] font-black text-amber-900 shrink-0 shadow-[1px_1px_0px_#000]">
                🔒 창 유지 필수
              </span>
            </div>
          )}

          {/* 참가자 영역 (학생: 본인 캐릭터 및 대기 안내 / 교사: 전체 그리드 및 빈 슬롯) */}
          {!isTeacher ? (
            <div className="bg-white/80 p-8 rounded-[28px] border-4 border-black shadow-[6px_6px_0px_#000] flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
              <div className="inline-flex items-center gap-2 bg-[#00F0FF] border-2 border-black px-4 py-1.5 rounded-full text-xs font-black shadow-[2px_2px_0px_#000] mb-5">
                <span className="animate-pulse">🟢</span>
                <span>현재 {participantCount}명 참가 중</span>
              </div>

              {/* 본인 캐릭터 단독 카드 */}
              <div className="flex flex-col items-center p-5 bg-[#FFF59D] rounded-2xl border-4 border-black shadow-[4px_4px_0px_#000] min-w-[170px] mb-5">
                <div className="w-20 h-20 bg-white rounded-2xl border-4 border-black flex items-center justify-center text-5xl shadow-[3px_3px_0px_#000] mb-3">
                  {participants[0]?.emoji || '👶'}
                </div>
                <span className="bg-indigo-600 text-white px-3.5 py-1 rounded-xl text-base font-black border-2 border-black shadow-[2px_2px_0px_#000] mb-1">
                  {participants[0]?.nickname || nickname || '나'}
                </span>
                <span className="text-xs font-bold text-slate-700">입장 완료!</span>
              </div>

              <p className="text-sm md:text-base font-black text-slate-800 flex items-center gap-2">
                <span>선생님이 게임을 시작할 때까지 잠시만 기다려주세요!</span>
                <span className="inline-block animate-bounce">⏳</span>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 bg-white/70 p-4 rounded-[28px] border-4 border-black shadow-[6px_6px_0px_#000]">
              {students.map((p: any) => (
                <div key={p.id} className="flex flex-col items-center animate-in fade-in zoom-in duration-300 group relative">
                  <button
                    onClick={() => removeParticipant(p.id)}
                    title="학생 내보내기"
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white border-2 border-black rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md font-black cursor-pointer hover:bg-black"
                  >
                    ✕
                  </button>
                  <div className={`w-12 h-12 rounded-xl border-4 flex items-center justify-center text-2xl shadow-[2.5px_2.5px_0px_#000] mb-1.5 transition-transform hover:scale-105 ${p.isBot ? 'bg-slate-900 border-black animate-pulse-subtle' : 'bg-white border-black'
                    }`}>
                    {p.isBot ? (p.botLevel === 'easy' ? '🐢' : p.botLevel === 'medium' ? '🐇' : '🐆') : (p.emoji || '👶')}
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border-2 border-black shadow-[1.5px_1.5px_0px_#000] truncate max-w-full ${p.nickname === nickname ? 'bg-indigo-600 text-white' : p.isBot ? 'bg-slate-700 text-white' : 'bg-white text-slate-800'
                    }`}>
                    {p.nickname}
                  </span>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 10 - students.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="flex flex-col items-center opacity-20">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl border-4 border-dashed border-slate-400 flex items-center justify-center text-lg font-bold mb-1.5">
                    ?
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 설정 섹션 (교사 전용) */}
          {isTeacher && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* AI 로봇 설정 */}
              <div className="bg-white p-4 md:p-5 rounded-[28px] border-4 border-black shadow-[8px_8px_0px_#000] flex flex-col h-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-indigo-600 border-2 border-black rounded-xl flex items-center justify-center text-lg shadow-[2px_2px_0px_#000]">🤖</div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">AI 로봇 친구 추가</h3>
                    <p className="text-xs font-bold text-slate-500">학생 수가 적을 때 연습 상대로 추가하세요</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 flex-1">
                  {(['easy', 'medium', 'hard'] as const).map(lvl => (
                    <div key={lvl} className="flex flex-col justify-between p-3 rounded-2xl border-3 border-black bg-slate-50 gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm">
                          {lvl === 'easy' ? '🐢 초급' : lvl === 'medium' ? '🐇 중급' : '🐆 고급'}
                        </span>
                        <span className="text-[11px] font-black text-indigo-600 font-mono">
                          {botSpeeds[lvl]}타
                        </span>
                      </div>
                      <input
                        type="range"
                        min={lvl === 'easy' ? 50 : lvl === 'medium' ? 200 : 400}
                        max={lvl === 'easy' ? 200 : lvl === 'medium' ? 400 : 800}
                        step={10}
                        value={botSpeeds[lvl]}
                        onChange={(e) => updateBotSpeed(lvl, Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <button
                        onClick={() => handleAddBot(lvl)}
                        className="w-full py-1.5 bg-white border-2 border-black rounded-xl font-black text-xs hover:bg-[#FFE600] active:translate-y-[1px] shadow-[2px_2px_0px_#000] transition-all cursor-pointer"
                      >
                        + 봇 추가
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 게임 플레이 세부 옵션 */}
              <div className="bg-white p-4 md:p-5 rounded-[28px] border-4 border-black shadow-[8px_8px_0px_#000] flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-[#FF007F] border-2 border-black rounded-xl flex items-center justify-center text-lg shadow-[2px_2px_0px_#000]">⚙️</div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">게임 규칙 설정</h3>
                    <p className="text-xs font-bold text-slate-500">수업 난이도에 맞게 옵션을 조정하세요</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border-2 border-black cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={showSpace}
                      onChange={(e) => setShowSpace(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className="text-xs font-black">띄어쓰기 기호 표시</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border-2 border-black cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={removePunctuation}
                      onChange={(e) => setRemovePunctuation(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className="text-xs font-black">문장부호 제외</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border-2 border-black cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={enableFlawlessBonus}
                      onChange={(e) => setEnableFlawlessBonus(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className="text-xs font-black">무오타 보너스 활성화</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border-2 border-black cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={hideStudentTrack}
                      onChange={(e) => setHideStudentTrack(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className="text-xs font-black">학생 화면 트랙 숨김</span>
                  </label>
                </div>

                {/* 시작 버튼 */}
                <button
                  onClick={handleStartGame}
                  className="w-full py-4 bg-[#FFE600] text-slate-950 font-black text-xl rounded-2xl border-4 border-black shadow-[4px_4px_0px_#000] hover:bg-[#FFD600] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>📚 꾸러미 고르고 시작하기</span>
                  <span className="text-2xl">🚀</span>
                </button>

                <p className="text-xs font-bold text-slate-600 mt-3 flex items-center justify-center gap-1.5 text-center">
                  <span>💡</span>
                  <span>새로고침 또는 창 종료 시 게임이 종료됩니다. 본 게임이 완전히 끝날 때까지 브라우저 창을 유지해 주세요.</span>
                </p>
              </div>
            </div>
          )}

          {/* 학생 대기 안내 (학생 전용) */}
          {!isTeacher && (
            <div className="bg-white p-6 rounded-[28px] border-4 border-black shadow-[8px_8px_0px_#000] text-center space-y-3">
              <div className="text-5xl animate-bounce">🏎️</div>
              <h3 className="text-2xl font-black text-slate-900">선생님이 게임을 시작하기를 기다리고 있어요!</h3>
              <p className="text-sm font-bold text-slate-500">선생님이 지문을 고르면 3초 카운트다운 후 바로 시작됩니다.</p>
            </div>
          )}
        </div>

        {/* QR 코드 모달 */}
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white p-6 rounded-3xl border-4 border-black shadow-[8px_8px_0px_#000] flex flex-col items-center gap-4 max-w-sm w-full animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-black text-slate-900">📱 카메라로 찍어 바로 입장</h3>
              <div className="p-4 bg-white rounded-2xl border-3 border-black shadow-[4px_4px_0px_#000]">
                <QRCodeSVG value={inviteLink} size={200} />
              </div>
              <p className="text-xs font-bold text-slate-500 text-center">태블릿이나 스마트폰 카메라로 QR 코드를 비추면 방으로 직행합니다.</p>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 bg-slate-900 text-white font-black rounded-xl border-2 border-black hover:bg-slate-800 transition-all cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* 연결 실패 / 방 종료 시 싱글 모드(혼자 하기) 전환 모달 */}
        {showFallbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white p-6 md:p-8 rounded-[32px] border-4 border-black shadow-[8px_8px_0px_#000] max-w-md w-full text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="text-5xl">🛡️</div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">수업 중단 방지 안내</h3>
                <p className="text-sm font-extrabold text-rose-600 leading-relaxed bg-rose-50 p-3 rounded-xl border-2 border-rose-200">
                  {fallbackReason}
                </p>
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  네트워크 환경이나 학교 방화벽으로 인해 교사와의 실시간 연결이 유지되지 않습니다.<br />
                  수업을 멈추지 않고 <strong>AI 로봇과 함께하는 싱글 모드(혼자 하기)</strong>로 바로 전환할 수 있습니다.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    sessionStorage.setItem('tajapang_nickname', nickname || '나');
                    router.push('/practice');
                  }}
                  className="w-full py-3.5 bg-[#FFE600] text-slate-950 font-black text-lg rounded-2xl border-3 border-black shadow-[4px_4px_0px_#000] hover:bg-[#FFD600] active:translate-y-[2px] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>혼자 하기(싱글 모드)로 전환</span>
                  <span>🚀</span>
                </button>
                <button
                  onClick={() => router.push('/?view=join')}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 font-black text-sm rounded-xl border-2 border-black hover:bg-slate-200 transition-all cursor-pointer"
                >
                  홈 화면으로 돌아가기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 토스트 알림 */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-black text-sm px-6 py-3 rounded-2xl border-2 border-white shadow-[4px_4px_0px_#000] animate-in fade-in slide-in-from-bottom-4 duration-200 z-50">
            {toastMessage}
          </div>
        )}
      </main>
    );
  }

  // 지문 고르기 단계 (preparing)
  if (roomStatus === 'preparing') {
    return (
      <main className="min-h-screen bg-[#FFF59D] p-4 md:p-8 flex items-center justify-center">
        {isTeacher ? (
          <div className="w-full max-w-5xl bg-white rounded-[32px] border-4 border-black shadow-[10px_10px_0px_#000] p-8 md:p-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <h2 className="text-3xl font-black text-slate-950 flex items-center gap-3">
                <span className="text-4xl bg-indigo-50 border-2 border-black w-16 h-16 flex items-center justify-center rounded-2xl shadow-[2px_2px_0px_#000]">📚</span>
                타자팡 꾸러미 고르기
              </h2>
              <button
                onClick={() => setRoomStatus('waiting')}
                className="flex items-center gap-2 bg-slate-900 text-white border-2 border-black px-6 py-3 rounded-2xl font-black hover:bg-[#FF007F] transition-all shadow-[3px_3px_0px_#000] active:translate-y-[1px] active:shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                🏠 대기실로 돌아가기
              </button>
            </div>
            <ContentSelector
              roomCode={roomCode}
              onStartMultiplayer={handleStartMultiplayer}
              currentSettings={{
                comboWeight,
                showSpace,
                removePunctuation,
                hideStudentTrack,
                botSpeeds
              }}
            />
          </div>
        ) : (
          <div className="text-center space-y-8 bg-white p-8 md:p-10 rounded-[32px] border-4 border-black shadow-[8px_8px_0px_#000] max-w-md animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="w-32 h-32 bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000] flex items-center justify-center text-6xl mx-auto animate-bounce">
                👨‍🏫
              </div>
              <div className="absolute top-0 right-10 w-6 h-6 bg-[#FFF59D] border-2 border-black rounded-full animate-ping"></div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">선생님이 문제를 고르고 있어요!</h2>
              <p className="text-lg font-black text-indigo-600">곧 게임이 시작됩니다. 손가락 준비! 🚀</p>
            </div>
            <div className="flex justify-center gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-4 h-4 bg-indigo-600 border-2 border-black rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
              ))}
            </div>
          </div>
        )}
      </main>
    );
  }

  return null;
}
