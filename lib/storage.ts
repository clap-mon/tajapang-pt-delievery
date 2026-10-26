/**
 * 학생 및 교사 로컬스토리지 (Local-First Storage) 관리 모듈
 * 외부 서버나 계정 없이 브라우저 로컬 기기에만 안전하게 전적을 보관합니다.
 */

export interface TypingRecord {
  id: string;
  date: number;
  cpm: number;
  accuracy: number;
  contentTitle?: string;
  roomCode?: string;
}

const STORAGE_KEYS = {
  RECORDS: "tajapang_student_records",
  CUSTOM_PACKAGES: "tajapang_custom_packages",
  NICKNAME: "tajapang_nickname",
  EMOJI: "tajapang_emoji",
};

// 학생 플레이 기록 로컬 저장
export const saveStudentRecord = (record: Omit<TypingRecord, "id" | "date">) => {
  if (typeof window === "undefined") return;
  try {
    const prevStr = localStorage.getItem(STORAGE_KEYS.RECORDS);
    const prev: TypingRecord[] = prevStr ? JSON.parse(prevStr) : [];
    const newRecord: TypingRecord = {
      ...record,
      id: Math.random().toString(36).substring(2, 9),
      date: Date.now(),
    };
    const updated = [newRecord, ...prev].slice(0, 50); // 최근 50개 보관
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save local record:", e);
  }
};

// 학생 플레이 기록 로컬 조회
export const getStudentRecords = (): TypingRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const str = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return str ? JSON.parse(str) : [];
  } catch (e) {
    return [];
  }
};
