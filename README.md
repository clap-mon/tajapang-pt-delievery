# 🏎️ 타자팡 (TajaPang) - PeerJS WebRTC P2P 무서버 버전

> **외부 계정이나 API 키 설정이 일체 필요 없는 Zero-Config 로컬 퍼스트 & P2P 실시간 멀티플레이 타자 연습 플랫폼**

---

## 🌟 주요 특징

1. **외부 서비스 키 0개 (Zero-Config)**
   - Supabase, Firebase, PartyKit 등 외부 실시간 DB나 서버 계정이 전혀 필요 없습니다.
   - Vercel에 환경 변수 없이 코드만 올리면 즉시 전 세계 어디서든 작동합니다.
2. **WebRTC P2P (교사 = 방장 호스트, 학생 = 게스트)**
   - PeerJS 기본 공용 서버(`0.peerjs.com`)와 기본 STUN/TURN을 그대로 사용합니다.
   - 교사의 브라우저가 직접 방장 역할을 수행하며, 학생들과 P2P DataChannel로 데이터를 고속 교환합니다.
3. **수업 중단 방지 안전망 (Graceful Fallback)**
   - 엄격한 학교 방화벽 환경으로 10초 이내에 P2P 연결이 되지 않으면(`onFail`) 즉시 **"혼자 하기(싱글 모드)" 전환 모달**이 표시되어 수업이 멈추지 않고 계속됩니다.
   - 교사의 브라우저가 종료되거나 연결이 끊기면(`onHostLost`) 지금까지의 연습 기록을 유지한 채 싱글 연습 모드로 자연스럽게 전환됩니다.
   - 순간적인 네트워크 끊김 시 3초 간격으로 최대 5회 자동 재연결을 시도합니다.
4. **학급 수업 최적화 설계**
   - 한 방 최대 25명 정원 엄격 제한 (초과 시 안내 후 자동 종료).
   - 학생 타수/진행도는 0.5초 간격으로 스로틀링되어 네트워크 부하를 원천 차단합니다.
   - 교사는 1초마다 실시간 순위표를 방송하고 경기 종료 시 최종 결과를 통보합니다.
   - 학생 개인정보를 서버에 저장하지 않으며, 전적은 학생 브라우저 로컬스토리지에만 안전하게 보관됩니다.

---

## 🚀 Vercel 배포 방법 (환경 변수 없음 - 초간단 3단계)

본 프로젝트는 외부 API 키나 데이터베이스 연결이 전혀 필요 없으므로, Vercel 배포 시 **환경 변수를 단 하나도 입력할 필요가 없습니다.**

### 1단계: 깃허브(GitHub) 저장소에 코드 업로드
새 GitHub 레포지토리를 생성하고 `c:\dev\tajapang-peerjs-turn` 폴더의 코드를 푸시합니다.
```bash
git init
git add .
git commit -m "feat: PeerJS WebRTC P2P 타자팡 릴리즈"
git branch -M main
git remote add origin <사용자의_깃허브_저장소_URL>
git push -u origin main
```

### 2단계: Vercel 대시보드에서 프로젝트 가져오기 (Import)
1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인합니다.
2. **`Add New...`** -> **`Project`**를 클릭합니다.
3. 1단계에서 올린 깃허브 저장소를 찾아 **`Import`** 버튼을 클릭합니다.
4. Framework Preset이 **Next.js**로 자동 인식되는 것을 확인합니다.

### 3단계: 환경 변수 없이 바로 Deploy 클릭!
- **Environment Variables(환경 변수) 섹션은 아무것도 입력하지 않고 그대로 비워둡니다.**
- 하단의 **`Deploy`** 버튼을 클릭합니다.
- 약 1분 후 빌드가 완료되면 고유한 Vercel 도메인(`https://your-project.vercel.app`)으로 즉시 서비스가 시작됩니다!

### 💡 Vercel 요금제 및 납품처 안내 (라이선스 유의사항)
- **Vercel 요금제 정책**: Vercel 공식 문서에 따르면 "Hobby는 비상업적 개인 용도로만 쓸 수 있고, 상업적 사용에는 Pro나 Enterprise 요금제가 필요"합니다.
> *"본 소프트웨어 운영에 필요한 호스팅 계정과 요금제는 납품처(도입 기관)가 직접 결정하고 책임집니다."*

---

## 📁 주요 프로젝트 구조

```text
c:\dev\tajapang-peerjs-turn\
├── app\
│   ├── page.tsx                    # 메인 랜딩 및 방 코드 입장 / 생성
│   ├── room\[code]\page.tsx        # 대기실 (교사: 방코드, 학생명단, 시작 / 학생: 대기, 10초 타임아웃)
│   ├── room\[code]\play\page.tsx   # 인게임 (교사: 1초 순위표 방송 / 학생: 0.5초 진척도 전송)
│   ├── practice\                   # 싱글 연습 모드 (AI 봇 대전 및 자유 연습)
│   └── components\                 # 공통 컴포넌트 (로고 등)
├── src\
│   └── net\
│       ├── room.js                 # PeerJS 통합 네트워크 모듈 (HostRoom, GuestRoom)
│       └── room.d.ts               # TypeScript 타입 정의
├── lib\
│   └── storage.ts                  # 학생 전적 로컬스토리지 관리 모듈
├── package.json                    # peerjs 기반 최소 의존성
└── README.md                       # 배포 가이드 문서
```
