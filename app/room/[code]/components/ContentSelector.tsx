"use client";

import React, { useState, useEffect } from 'react';
import { getActiveHostRoom } from '@/src/net/room';
import { appAlert } from '@/lib/appDialog';

interface ContentSelectorProps {
  roomCode?: string;
  isPractice?: boolean;
  onStartPractice?: (problemSet: string[], contentOption: 'sentence' | 'word') => void;
  onStartMultiplayer?: (gameData: any) => void;
  currentSettings: {
    comboWeight: number;
    showSpace: boolean;
    removePunctuation: boolean;
    hideStudentTrack: boolean;
    botSpeeds: any;
  };
  onComplete?: () => void;
}

export default function ContentSelector({ roomCode, isPractice = false, onStartPractice, onStartMultiplayer, currentSettings }: ContentSelectorProps) {
  const [activeTab, setActiveTab] = useState<'standard' | 'custom'>('standard');
  const [problemCount, setProblemCount] = useState(20); // 기본 20개
  const [loading, setLoading] = useState(false);
  const [basicContent, setBasicContent] = useState<any>(null);

  // 대용량 문장 꾸러미 비동기 로드 (Code Splitting)
  useEffect(() => {
    import('./data/basicContent').then((mod) => {
      setBasicContent(mod.basicContent);
    }).catch(err => {
      console.error("Failed to load basicContent: ", err);
    });
  }, []);

  // 배포용 빌드 여부 판정
  const isProd = process.env.NODE_ENV === 'production';

  // 통합 타자 꾸러미 메타데이터 정의
  const standardPackages = [
    { id: 'korean', title: '국어 5-1', icon: 'ㄱㄴㄷ', description: '단원별 개념을 활용한 타자 학습.' },
    { id: 'idiom_expression', title: '관용 표현', icon: '✨', description: '속담, 관용어구, 사자성어로 어휘력 키우기.' },
    { id: 'goyu', title: '순우리말 고유어', icon: '🌱', description: '아름답고 유익한 고유어 100선.' },
  ];

  // 관용 표현 단원 구성
  const idiomUnits = [
    { unit: 1, title: '속담', key: 'idiom_proverbs' },
    { unit: 2, title: '관용어구', key: 'idiom_phrases' },
    { unit: 3, title: '사자성어', key: 'idiom_four_words' },
  ];

  // 국어 5-1 상세 단원 구성 (6개 단원)
  const korean51Units = [
    { unit: 1, title: '1 대화를 나누어요' },
    { unit: 2, title: '2 체험한 일을 글로 써요' },
    { unit: 3, title: '3 발표하고 질문해요' },
    { unit: 4, title: '4 대상을 설명해요' },
    { unit: 5, title: '5 의논하며 토의해요' },
    { unit: 6, title: '6 작품을 즐겨요' },
  ];

  // 선택된 꾸러미 ID (국어 5-1의 경우 실질 키 예: korean_5_1_unit_1)
  const [selectedBasic, setSelectedBasic] = useState('korean_5_1_unit_1');
  const selectedSemester = '5-1';
  const [selectedUnit, setSelectedUnit] = useState<number>(1);

  const [previewList, setPreviewList] = useState<string[]>([]);
  const [previewType, setPreviewType] = useState<'sentence' | 'word'>('sentence');
  const [showPreview, setShowPreview] = useState(false);

  // 직접 입력 관련 상태 및 생성된 리스트
  const [customText, setCustomText] = useState('');
  const [customMode, setCustomMode] = useState<'sentence' | 'word'>('sentence');
  const [generatedList, setGeneratedList] = useState<string[]>([]);

  // 개별 꾸러미 문장/낱말 모드 상태 관리
  const [packageModes, setPackageModes] = useState<Record<string, 'sentence' | 'word'>>({
    english: 'sentence',
    science: 'sentence',
    digital_citizen: 'sentence',
    goyu: 'sentence',
    idiom_proverbs: 'sentence',
    idiom_phrases: 'sentence',
    idiom_four_words: 'sentence',
    // 국어 5-1 단원별 모드 기본값 세팅
    korean_5_1_unit_1: 'sentence',
    korean_5_1_unit_2: 'sentence',
    korean_5_1_unit_3: 'sentence',
    korean_5_1_unit_4: 'sentence',
    korean_5_1_unit_5: 'sentence',
    korean_5_1_unit_6: 'sentence',
  });

  // activeTab 변경 시 selectedBasic 동기화 및 텍스트 초기화
  useEffect(() => {
    if (activeTab === 'standard') {
      setSelectedBasic('korean_5_1_unit_1');
    } else if (activeTab === 'custom') {
      setSelectedBasic('custom_input');
      setGeneratedList([]);
      setCustomText('');
      setCustomMode('sentence');
    }
  }, [activeTab]);

  // 국어 5-1 단원 변경 시 selectedBasic 키 업데이트
  const handleKoreanSelect = (unit: number) => {
    setSelectedUnit(unit);
    const key = `korean_5_1_unit_${unit}`;
    setSelectedBasic(key);
  };

  // 꾸러미 미리보기 로직
  const handlePreview = (id: string) => {
    if (!basicContent) return;
    const isKoreanCard = id === 'korean';
    const isIdiomCard = id === 'idiom_expression';
    let targetKey = id;
    if (isKoreanCard) {
      targetKey = selectedBasic.startsWith('korean') ? selectedBasic : `korean_5_1_unit_${selectedUnit}`;
    } else if (isIdiomCard) {
      targetKey = selectedBasic.startsWith('idiom') ? selectedBasic : 'idiom_proverbs';
    }
    const mode = packageModes[targetKey] || 'sentence';
    const pkgData = basicContent[targetKey];
    const list = pkgData ? (mode === 'sentence' ? pkgData.sentences : pkgData.words) : [];
    setPreviewList(list);
    setPreviewType(mode);
    setShowPreview(true);
  };

  // 국어 5-1 개별 단원 카드에서 직접 미리보기
  const handleKoreanUnitPreview = (unit: number) => {
    if (!basicContent) return;
    const key = `korean_5_1_unit_${unit}`;
    const mode = packageModes[key] || 'sentence';
    const pkgData = basicContent[key];
    const list = pkgData ? (mode === 'sentence' ? pkgData.sentences : pkgData.words) : [];
    setPreviewList(list);
    setPreviewType(mode);
    setSelectedBasic(key);
    setSelectedUnit(unit);
    setShowPreview(true);
  };

  // 관용표현 개별 단원 카드에서 직접 미리보기
  const handleIdiomUnitPreview = (key: string) => {
    if (!basicContent) return;
    const mode = packageModes[key] || 'sentence';
    const pkgData = basicContent[key];
    const list = pkgData ? (mode === 'sentence' ? pkgData.sentences : pkgData.words) : [];
    setPreviewList(list);
    setPreviewType(mode);
    setSelectedBasic(key);
    setShowPreview(true);
  };

  // 사용자가 직접 입력한 텍스트 실시간 파싱 및 카운팅 로직
  const handleCustomTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomText(e.target.value);
  };

  // customText 또는 customMode가 변경될 때 실시간으로 문장/낱말 추출
  useEffect(() => {
    if (activeTab !== 'custom' || !customText.trim()) {
      setGeneratedList([]);
      return;
    }

    const text = customText;
    const mode = customMode;
    let resultList: string[] = [];

    if (mode === 'sentence') {
      // 1. 문장 구분 기호(. , \n, ? , !)를 보존하며 나누기 (후방 탐색 활용)
      const rawSentences = text.split(/(?<=[.?!])|\n/);
      const uniqueSentences = new Set<string>();

      for (let s of rawSentences) {
        s = s.trim().replace(/\s+/g, ' '); // 연속 공백 제거

        // [보안/정제] 웹 주소 배제
        if (/https?:\/\/[^\s]+|www\.[^\s]+/i.test(s)) {
          continue;
        }

        // 글자 수 3자 이상 60자 이하이며, 최소 1글자 이상의 한글이 포함되고 영문이 전혀 없는 문장만 1차 필터링
        if (s.length >= 3 && s.length <= 60 && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(s) && !/[a-zA-Z]/.test(s)) {
          // 일반 키보드로 칠 수 없는 특수문자나 이모티콘 등 제거
          s = s.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣,.'"()~\-!?]/g, '');
          s = s.trim();
          if (s.length >= 3) {
            uniqueSentences.add(s);
          }
        }
      }
      resultList = Array.from(uniqueSentences).slice(0, 50);
    } else {
      // 2. 낱말 구분 기준(공백, 줄바꿈, 쉼표, 마침표, 기호 등)으로 나누기
      const rawWords = text.split(/[\s.\n?!,;:"'()~\-_]+/);
      const uniqueWords = new Set<string>();

      for (let w of rawWords) {
        w = w.trim();

        // [보안/정제] 웹 주소 배제
        if (/https?:\/\/[^\s]+|www\.[^\s]+/i.test(w)) {
          continue;
        }

        // 낱말 글자 수 1자 이상 15자 이하이며, 최소 1글자 이상의 한글이 포함되고 영문이 전혀 없는 낱말만 필터링
        if (w.length >= 1 && w.length <= 15 && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(w) && !/[a-zA-Z]/.test(w)) {
          // 특수문자 제거
          w = w.replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣\-]/g, '');
          w = w.trim();
          if (w.length >= 1) {
            uniqueWords.add(w);
          }
        }
      }
      resultList = Array.from(uniqueWords).slice(0, 50);
    }

    setGeneratedList(resultList);
  }, [customText, customMode, activeTab]);

  const handleStartGame = async () => {
    let finalProblemSet: string[] = [];

    if (activeTab === 'standard') {
      if (!basicContent) {
        appAlert('문장 데이터를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
      const mode = packageModes[selectedBasic] || 'sentence';
      const pkgData = basicContent[selectedBasic];
      const fullList = pkgData ? [...(mode === 'sentence' ? pkgData.sentences : pkgData.words)] : [];
      finalProblemSet = fullList.sort(() => Math.random() - 0.5).slice(0, problemCount);
    } else {
      finalProblemSet = generatedList;
    }

    if (finalProblemSet.length === 0) {
      return appAlert('먼저 문제를 생성하거나 파일을 업로드해주세요!');
    }

    if (isPractice) {
      if (onStartPractice) {
        const mode = activeTab === 'standard' ? (packageModes[selectedBasic] || 'sentence') : 'sentence';
        onStartPractice(finalProblemSet, mode);
      }
      return;
    }

    setLoading(true);
    try {
      const gameData = {
        problemSet: finalProblemSet,
        targetText: finalProblemSet[0],
        settings: {
          ...currentSettings,
          mode: 'strict',
          contentOption: activeTab === 'standard' ? packageModes[selectedBasic] : 'sentence',
          packageType: activeTab
        }
      };

      if (onStartMultiplayer) {
        onStartMultiplayer(gameData);
      } else {
        const hostRoom = getActiveHostRoom();
        if (hostRoom) {
          hostRoom.start(gameData, 3);
        }
      }
    } catch (error: any) {
      appAlert(`게임 시작 오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 탭 목록 선언
  const tabList = isPractice
    ? [
        { id: 'standard' as const, label: '📋 타자 꾸러미' },
      ]
    : [
        { id: 'standard' as const, label: '📋 타자 꾸러미' },
        { id: 'custom' as const, label: '✍️ 직접 입력하기' },
      ];

  return (
    <div className="space-y-6">
      {/* 탭 메뉴 */}
      <div className="flex p-1.5 bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl w-fit mx-auto">
        {tabList.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-lg font-black text-sm transition-all ${activeTab === tab.id
              ? 'bg-[#FFE600] text-black border-2 border-black scale-100 shadow-none'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭별 콘텐츠 */}
      <div>
        {activeTab === 'standard' && !basicContent && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
            <div className="w-10 h-10 border-4 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
            <span className="text-sm font-black text-slate-500">꾸러미 데이터를 불러오는 중...</span>
          </div>
        )}

        {activeTab === 'standard' && basicContent && (
          <div className="space-y-6 animate-in fade-in duration-100">
            {/* 카드 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {standardPackages.map((pkg) => {
                const isKoreanSelected = pkg.id === 'korean' && selectedBasic.startsWith('korean');
                const isIdiomSelected = pkg.id === 'idiom_expression' && selectedBasic.startsWith('idiom');
                const isNormalSelected = selectedBasic === pkg.id;
                const isSelected = isKoreanSelected || isIdiomSelected || isNormalSelected;

                // 스위치 적용용 타겟 키 판정
                let targetKey = pkg.id;
                if (pkg.id === 'korean') {
                  targetKey = selectedBasic.startsWith('korean') ? selectedBasic : 'korean_5_1_unit_1';
                } else if (pkg.id === 'idiom_expression') {
                  targetKey = selectedBasic.startsWith('idiom') ? selectedBasic : 'idiom_proverbs';
                }

                return (
                  <div
                    key={pkg.id}
                    onClick={() => {
                      if (pkg.id === 'korean') {
                        handleKoreanSelect(selectedUnit);
                      } else if (pkg.id === 'idiom_expression') {
                        setSelectedBasic('idiom_proverbs');
                      } else {
                        setSelectedBasic(pkg.id);
                      }
                    }}
                    className={`p-5 rounded-xl border-3 border-black transition-all cursor-pointer text-left relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isSelected
                      ? 'bg-[#FFE600] text-black'
                      : 'bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="text-4xl mb-2">
                        {pkg.icon === 'ㄱㄴㄷ' ? (
                          <div className="flex items-center justify-center bg-slate-800 text-white font-black rounded-lg w-10 h-10 text-[11px] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none">
                            ㄱㄴㄷ
                          </div>
                        ) : (
                          pkg.icon
                        )}
                      </div>
                      {/* 문장/낱말 슬라이드 스위치 */}
                      {pkg.id !== 'idiom_expression' && pkg.id !== 'korean' && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation(); // 부모 카드 클릭 방지
                            setPackageModes(prev => ({
                              ...prev,
                              [targetKey]: prev[targetKey] === 'sentence' ? 'word' : 'sentence'
                            }));
                          }}
                          className="flex items-center gap-1 bg-white p-0.5 rounded-lg relative cursor-pointer border-2 border-black w-[130px] h-[28px] overflow-hidden"
                        >
                          <div
                            className={`absolute top-0.5 bottom-0.5 rounded-md bg-black transition-all duration-300 ${packageModes[targetKey] === 'sentence'
                              ? 'left-0.5 w-[62px]'
                              : 'left-[64px] w-[62px]'
                              }`}
                          />
                          <span className={`text-[10px] font-black z-10 w-[62px] text-center transition-colors duration-200 ${packageModes[targetKey] === 'sentence' ? 'text-[#FFE600]' : 'text-slate-800'
                            }`}>문장</span>
                          <span className={`text-[10px] font-black z-10 w-[62px] text-center transition-colors duration-200 ${packageModes[targetKey] === 'word' ? 'text-[#FFE600]' : 'text-slate-800'
                            }`}>낱말/어구</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-black mb-1">{pkg.title}</h3>
                    <p className="text-xs font-bold text-slate-800 mb-3">{pkg.description}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(pkg.id);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border-2 border-black rounded-md text-xs font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      🔍 미리보기
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 국어 5-1 선택 시 하위 단원 뷰어 렌더링 */}
            {selectedBasic.startsWith('korean') && (
              <div className="p-6 bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl text-left space-y-4 animate-in fade-in duration-100">
                <div className="flex justify-between items-center border-b-2 border-black pb-3">
                  <h4 className="text-xl font-black text-black">국어 5-1 단원 선택</h4>
                </div>

                {/* 6개 단원 그리드 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {korean51Units.map((u) => {
                    const unitKey = `korean_5_1_unit_${u.unit}`;
                    const isUnitSelected = selectedBasic === unitKey;

                    return (
                      <div
                        key={u.unit}
                        onClick={() => handleKoreanSelect(u.unit)}
                        className={`p-4 rounded-xl border-2 border-black transition-all cursor-pointer flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${isUnitSelected
                          ? 'bg-yellow-100/90 font-black'
                          : 'bg-slate-50/50 hover:bg-white'
                          }`}
                      >
                        <span className="text-sm font-black text-black mb-2">{u.title}</span>
                        <div className="flex justify-between items-center mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleKoreanUnitPreview(u.unit);
                            }}
                            className="px-2 py-1 bg-white border border-black text-[10px] font-black rounded hover:bg-slate-100"
                          >
                            🔍 내용 미리보기
                          </button>

                          {/* 개별 문장/낱말 슬라이드 스위치 */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation(); // 버블링 방지
                              handleKoreanSelect(u.unit); // 슬라이더 클릭 시 해당 단원 즉시 활성화(선택)
                              setPackageModes(prev => ({
                                ...prev,
                                [unitKey]: prev[unitKey] === 'sentence' ? 'word' : 'sentence'
                              }));
                            }}
                            className="flex items-center gap-1 bg-white p-0.5 rounded-lg relative cursor-pointer border-2 border-black w-[130px] h-[28px] overflow-hidden shrink-0 select-none shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none transition-all"
                          >
                            <div
                              className={`absolute top-0.5 bottom-0.5 rounded-md bg-black transition-all duration-300 ${packageModes[unitKey] === 'sentence'
                                ? 'left-0.5 w-[62px]'
                                : 'left-[64px] w-[62px]'
                                }`}
                            />
                            <span className={`text-[10px] font-black z-10 w-[62px] text-center transition-colors duration-200 ${packageModes[unitKey] === 'sentence' ? 'text-[#FFE600]' : 'text-slate-800'
                              }`}>문장</span>
                            <span className={`text-[10px] font-black z-10 w-[62px] text-center transition-colors duration-200 ${packageModes[unitKey] === 'word' ? 'text-[#FFE600]' : 'text-slate-800'
                              }`}>낱말/어구</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 관용 표현 선택 시 하위 단원 뷰어 렌더링 */}
            {selectedBasic.startsWith('idiom') && (
              <div className="p-6 bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl text-left space-y-4 animate-in fade-in duration-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-2 border-black pb-3">
                  <h4 className="text-xl font-black text-black">관용 표현 분류 선택</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {idiomUnits.map((u) => {
                    const isUnitSelected = selectedBasic === u.key;

                    return (
                      <div
                        key={u.unit}
                        onClick={() => setSelectedBasic(u.key)}
                        className={`p-4 rounded-xl border-2 border-black transition-all cursor-pointer flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${isUnitSelected
                          ? 'bg-yellow-100/90 font-black'
                          : 'bg-slate-50/50 hover:bg-white'
                          }`}
                      >
                        <span className="text-sm font-black text-black mb-2">{u.title}</span>
                        <div className="flex justify-between items-center mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIdiomUnitPreview(u.key);
                            }}
                            className="px-2 py-1 bg-white border border-black text-[10px] font-black rounded hover:bg-slate-100"
                          >
                            🔍 내용 미리보기
                          </button>

                          {/* 개별 문장/낱말 슬라이드 스위치 (상단과 100% 동일한 알약 스위치) */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation(); // 버블링 방지
                              setSelectedBasic(u.key); // 슬라이더 클릭 시 해당 분류 즉시 선택 활성화
                              setPackageModes(prev => ({
                                ...prev,
                                [u.key]: prev[u.key] === 'sentence' ? 'word' : 'sentence'
                              }));
                            }}
                            className="flex items-center gap-1 bg-white p-0.5 rounded-lg relative cursor-pointer border-2 border-black w-[130px] h-[28px] overflow-hidden shrink-0 select-none shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none transition-all"
                          >
                            <div
                              className={`absolute top-0.5 bottom-0.5 rounded-md bg-black transition-all duration-300 ${packageModes[u.key] === 'sentence'
                                ? 'left-0.5 w-[62px]'
                                : 'left-[64px] w-[62px]'
                                }`}
                            />
                            <span className={`text-[10px] font-black z-10 w-[62px] text-center transition-colors duration-200 ${packageModes[u.key] === 'sentence' ? 'text-[#FFE600]' : 'text-slate-800'
                              }`}>문장</span>
                            <span className={`text-[10px] font-black z-10 w-[62px] text-center transition-colors duration-200 ${packageModes[u.key] === 'word' ? 'text-[#FFE600]' : 'text-slate-800'
                              }`}>낱말/어구</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-100">
            <div className="flex flex-col items-center justify-center p-6 border-4 border-black rounded-[32px] bg-white shadow-[6px_6px_0px_#000] text-center w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 w-full border-b-4 border-black pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">✍️</span>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 text-left">타자 연습 문장 직접 입력하기</h3>
                    <p className="text-xs font-black text-slate-500 text-left">연습하고 싶은 글을 아래 창에 복사해서 붙여넣으세요.</p>
                    <p className="text-[10px] font-black text-rose-500 mt-1 text-left">⚠️ 영어 문장/낱말은 추후 지원 예정입니다. 현재는 한글 문장만 추출됩니다.</p>
                  </div>
                </div>

                {/* 낱말 / 문장 모드 선택 스위치 */}
                <div className="flex bg-slate-100 p-1 border-2 border-black rounded-xl shadow-[2px_2px_0px_#000] gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCustomMode('sentence')}
                    className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${customMode === 'sentence'
                        ? 'bg-black text-white'
                        : 'bg-white text-slate-800 hover:bg-slate-50 border border-transparent'
                      }`}
                  >
                    📝 문장 단위
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomMode('word')}
                    className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${customMode === 'word'
                        ? 'bg-black text-white'
                        : 'bg-white text-slate-800 hover:bg-slate-50 border border-transparent'
                      }`}
                  >
                    🔤 낱말/어구 단위
                  </button>
                </div>
              </div>

              {/* 텍스트 입력창 (큼직한 높이의 textarea) */}
              <textarea
                value={customText}
                onChange={handleCustomTextChange}
                placeholder={
                  customMode === 'word'
                    ? "여기에 타자 연습할 글을 입력하거나 붙여넣으세요.\n입력된 글은 띄어쓰기(공백), 줄바꿈, 쉼표, 마침표 등을 기준으로 낱말(단어) 단위로 자동 분류됩니다."
                    : "여기에 타자 연습할 문장이나 긴 글을 입력하거나 붙여넣으세요. (예: 애국가, 동화, 책 문구 등)\n입력된 글은 마침표(.), 물음표(?), 느낌표(!), 엔터(\\n) 기준으로 문장이 자동 분류됩니다."
                }
                className="w-full h-64 p-5 rounded-2xl border-4 border-black font-bold text-slate-800 outline-none focus:bg-indigo-50/10 placeholder:text-slate-400 placeholder:font-bold resize-none shadow-[inset_3px_3px_0px_rgba(0,0,0,0.1)] text-base"
              />

              {/* 실시간 분석 상태 뱃지 */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full mt-4 pt-3 border-t-2 border-dashed border-black">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black bg-[#00FF66] border-2 border-black px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#000] text-slate-900">
                    분석 상태: {generatedList.length > 0 ? '준비 완료 ✨' : '글을 입력해주세요 ✏️'}
                  </span>
                  {generatedList.length > 0 && (
                    <span className="text-xs font-black bg-[#00F0FF] border-2 border-black px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#000] text-slate-900">
                      총 {generatedList.length}개 {customMode === 'word' ? '낱말/어구' : '문장'} 검출
                    </span>
                  )}
                </div>
                {generatedList.length > 0 && (
                  <button
                    onClick={() => {
                      setCustomText('');
                      setGeneratedList([]);
                    }}
                    className="bg-rose-500 text-white text-xs px-4 py-2 border-2 border-black rounded-xl font-black shadow-[2px_2px_0px_#000] hover:bg-rose-600 transition-all cursor-pointer active:translate-y-[1px] active:shadow-none"
                  >
                    초기화 ↺
                  </button>
                )}
              </div>
            </div>

            {/* 검출된 문장/낱말 리스트 미리보기 */}
            {generatedList.length > 0 && (
              <div className="bg-white p-6 rounded-[28px] border-4 border-black text-left shadow-[6px_6px_0px_#000] space-y-3">
                <p className="text-xs font-black text-slate-900 border-b-2 border-black pb-1.5 uppercase tracking-widest flex items-center gap-1.5">
                  📋 추출된 {customMode === 'word' ? '낱말/어구' : '문장'} 목록 (상위 최대 50개까지만 반영됩니다)
                </p>
                <div className="max-h-48 overflow-y-auto pr-1.5 custom-scrollbar space-y-2">
                  {generatedList.map((str, i) => (
                    <div key={i} className="text-xs font-bold text-slate-800 bg-slate-50 border-2 border-black rounded-xl p-2.5 flex gap-2.5 items-center">
                      <span className="bg-black text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-lg">{i + 1}</span>
                      <span className="truncate">{str}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 미리보기 모달 (기본 꾸러미용) */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-100">
          <div className="bg-white rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg p-8 animate-in fade-in duration-100 text-left">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-2xl font-black text-black">
                {previewType === 'sentence' ? '문장' : '낱말/어구'} 리스트 (총 {previewList.length}개)
              </h4>
              <button onClick={() => setShowPreview(false)} className="text-black hover:scale-110 text-2xl font-black">✕</button>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {previewList.map((item, i) => (
                <div key={i} className="bg-slate-50 p-4 rounded-xl text-black font-bold border-2 border-black">
                  {i + 1}. {item}
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="w-full mt-8 bg-[#FFE600] text-black border-3 border-black py-4 rounded-2xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 우리말샘 출처 안내 문구 */}
      {(selectedBasic.startsWith('idiom') || selectedBasic === 'goyu') && (
        <p className="text-[11px] font-black text-slate-400 text-center select-none animate-in fade-in duration-200">
          ℹ️ 본 서비스의 관용어, 속담, 사자성어 자료는 국립국어원 우리말샘 데이터를 바탕으로 제작되었습니다.
        </p>
      )}

      {/* 구분선 */}
      <div className="h-[3px] bg-black w-full"></div>

      {/* 하단 옵션 설정 */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-3xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <div className="flex flex-col items-start gap-3">
            <div className="flex justify-between w-full">
              <span className="text-sm font-black text-black uppercase tracking-widest ml-1">
                {activeTab === 'custom'
                  ? (customMode === 'word' ? '학습 낱말/어구 수' : '학습 문장 수')
                  : (selectedBasic && packageModes[selectedBasic] === 'word' ? '학습 낱말/어구 수' : '학습 문장 수')}
              </span>
              <span className="text-xl font-black text-black">
                {problemCount}
                {activeTab === 'custom'
                  ? (customMode === 'word' ? '개' : '문장')
                  : (selectedBasic && packageModes[selectedBasic] === 'word' ? '개' : '문장')}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={[5, 10, 20, 30, 40, 50].indexOf(problemCount) !== -1 ? [5, 10, 20, 30, 40, 50].indexOf(problemCount) : 1}
              onChange={(e) => setProblemCount([5, 10, 20, 30, 40, 50][Number(e.target.value)])}
              className="w-full md:w-64 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-black"
            />
            <div className="flex justify-between w-full text-[9px] font-black text-black px-1">
              <span>5</span>
              <span>10</span>
              <span>20</span>
              <span>30</span>
              <span>40</span>
              <span>50</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleStartGame}
          disabled={
            loading ||
            (activeTab === 'custom' && generatedList.length === 0)
          }
          className={`w-full md:w-auto px-10 py-4 rounded-2xl bg-[#FFE600] text-black text-2xl font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-3 ${loading ||
              (activeTab === 'custom' && generatedList.length === 0)
              ? 'opacity-50 grayscale border-4 border-black cursor-not-allowed'
              : ''
            }`}
        >
          {loading
            ? '준비 중...'
            : (activeTab === 'custom' && generatedList.length === 0)
              ? (customMode === 'word' ? '낱말/어구를 입력해 주세요 ✍️' : '문장을 입력해 주세요 ✍️')
              : '게임 시작하기! 🚀'
          }
        </button>
      </div>
    </div>
  );
}
