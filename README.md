# GIF Maker & Video Converter

이미지를 GIF 또는 동영상으로 변환하는 올인원 웹 애플리케이션입니다.

## 🌟 주요 기능

### 🎯 3가지 변환 모드

1. **이미지 → GIF** 🖼️
   - 여러 이미지를 GIF 애니메이션으로 변환
   - 프레임 순서 조정 (드래그 앤 드롭)
   - 크로스페이드 전환 효과
   - 속도, 크기, 품질 조절

2. **이미지 → 동영상** 🎬
   - 여러 이미지를 MP4 동영상으로 직접 변환
   - GIF를 거치지 않아 빠르고 효율적
   - 파일 크기 최적화

3. **GIF → 동영상** 🎥
   - 기존 GIF 파일을 MP4 동영상으로 변환
   - 파일 크기 50-70% 감소
   - SNS 업로드 최적화

### ✨ 세부 기능

**이미지 관리:**
- ✅ 다중 이미지 업로드 (드래그 앤 드롭 지원)
- ✅ 프레임 순서 변경 (드래그 앤 드롭)
- ✅ 개별 프레임 삭제
- ✅ 실시간 미리보기

**애니메이션 설정:**
- ✅ 속도 조절 (슬라이더 + 직접 입력)
- ✅ 크기 선택 (작음/보통/큼/사용자정의)
- ✅ 품질 조절 (빠르게 ↔ 고품질)
- ✅ 반복 횟수 설정
- ✅ 크로스페이드 전환 효과

**변환 기능:**
- ✅ 브라우저에서 실시간 처리 (서버 업로드 불필요)
- ✅ GIF 생성 및 다운로드
- ✅ 동영상 변환 및 다운로드
- ✅ 진행 상황 실시간 표시

## 🚀 기술 스택

- **Frontend**: HTML + TailwindCSS + Vanilla JavaScript
- **Backend**: Hono Framework
- **Runtime**: Cloudflare Workers/Pages
- **GIF 생성**: gif.js (클라이언트 사이드)
- **동영상 변환**: MediaRecorder API (WebM VP9)

## 📦 설치 및 실행

### 로컬 개발

```bash
# 의존성 설치
npm install

# 프로젝트 빌드
npm run build

# PM2로 개발 서버 시작
pm2 start ecosystem.config.cjs

# 서비스 테스트
curl http://localhost:3000

# PM2 로그 확인
pm2 logs webapp --nostream
```

### 포트 관리

```bash
# 포트 3000 정리
npm run clean-port

# 서비스 재시작
pm2 restart webapp
```

## 🌐 Cloudflare Pages 배포

### 준비사항

1. Cloudflare 계정 (무료)
2. Cloudflare API 키

### 배포 명령어

```bash
# 1. 빌드
npm run build

# 2. Cloudflare Pages 프로젝트 생성
npx wrangler pages project create webapp --production-branch main

# 3. 배포
npx wrangler pages deploy dist --project-name webapp
```

## 📖 사용 방법

### 1️⃣ 변환 모드 선택
첫 화면에서 원하는 변환 모드를 선택합니다:
- 이미지 → GIF
- 이미지 → 동영상
- GIF → 동영상

### 2️⃣ 파일 업로드
- 드래그 앤 드롭 또는 파일 선택
- JPG, PNG, GIF 형식 지원

### 3️⃣ 설정 조정 (이미지 → GIF/동영상만)
- **속도**: 슬라이더 또는 직접 입력 (0.1-3.0초)
- **크기**: 작음(320px) / 보통(480px) / 큼(640px)
- **품질**: 빠르게 ↔ 고품질
- **크로스페이드**: 부드러운 전환 효과 (선택)

### 4️⃣ 생성 및 다운로드
- 생성 버튼 클릭
- 진행 상황 확인
- 완성된 파일 다운로드

## 🎨 권장 설정

### 일반 사용
```
속도: 보통 (0.5초)
크기: 보통 (480px)
품질: 고품질
크로스페이드: 5
```

### SNS 공유
```
속도: 빠름 (0.3초)
크기: 작음 (320px)
품질: 보통
크로스페이드: OFF
```

### 고품질 작품
```
속도: 느림 (1.0초)
크기: 큼 (640px)
품질: 최고
크로스페이드: 7-10
```

## 📊 파일 크기 비교

| 형식 | 일반 크기 | 장점 |
|------|----------|------|
| GIF | 1-5 MB | 호환성 좋음 |
| WebM | 0.5-2 MB | 작은 크기, 고품질 |

💡 **팁**: GIF로 만든 후 동영상으로 변환하면 파일 크기가 50-70% 감소합니다!

## 🛠 프로젝트 구조

```
webapp/
├── src/
│   └── index.tsx          # Hono 백엔드
├── public/
│   └── static/
│       ├── app.js         # 프론트엔드 JavaScript
│       └── gif.worker.js  # GIF 생성 워커
├── dist/                  # 빌드 출력
├── ecosystem.config.cjs   # PM2 설정
├── wrangler.jsonc        # Cloudflare 설정
├── package.json
└── README.md
```

## 🔧 개발 스크립트

```bash
npm run dev              # Vite 개발 서버
npm run dev:sandbox      # Wrangler 로컬 서버
npm run build            # 프로젝트 빌드
npm run deploy           # Cloudflare Pages 배포
npm run clean-port       # 포트 3000 정리
npm run test             # 로컬 서버 테스트
```

## ⚙️ 환경 변수

Cloudflare Pages 배포 시 추가 환경 변수가 필요 없습니다. 모든 처리가 클라이언트 사이드에서 이루어집니다.

## 🌍 브라우저 지원

- ✅ Chrome/Edge (권장)
- ✅ Firefox
- ✅ Safari (WebM 지원 제한적)
- ⚠️ iOS Safari (WebM 재생 제한)

## 📝 라이선스

MIT License

## 🤝 기여

이슈나 개선 제안은 언제든 환영합니다!

---

© 2025 GIF Maker & Video Converter. Made with Hono + Cloudflare Pages
