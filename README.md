# GIF Maker

이미지 파일들을 업로드하여 애니메이션 GIF를 생성하는 웹 애플리케이션입니다.

## 프로젝트 개요

- **이름**: GIF Maker
- **목표**: 여러 이미지를 손쉽게 애니메이션 GIF로 변환
- **주요 기능**:
  - 다중 이미지 업로드 (드래그 앤 드롭 지원)
  - 프레임 순서 변경 (드래그 앤 드롭)
  - 프레임 속도 조절
  - GIF 크기 및 품질 설정
  - 반복 횟수 설정 (무한 루프 포함)
  - 브라우저에서 실시간 GIF 생성
  - 생성된 GIF 다운로드

## 실행 중인 서비스

- **개발 서버**: https://3000-i1xeidlom0adt0ng3m9bw-5c13a017.sandbox.novita.ai
- **상태**: ✅ 실행 중

## 기술 스택

- **Backend**: Hono Framework + Cloudflare Pages
- **Frontend**: HTML + TailwindCSS + Vanilla JavaScript
- **GIF 생성**: gif.js (클라이언트 사이드 라이브러리)
- **배포**: Cloudflare Workers/Pages (Edge Runtime)

## 데이터 아키텍처

- **클라이언트 사이드 처리**: 모든 이미지 처리와 GIF 생성은 사용자의 브라우저에서 수행
- **서버리스**: 서버에 파일을 업로드하지 않으며, 모든 작업이 클라이언트에서 완료
- **데이터 흐름**:
  1. 사용자가 이미지 파일 선택/드래그 앤 드롭
  2. 이미지가 메모리에 로드 (Base64 인코딩)
  3. gif.js를 사용하여 브라우저에서 GIF 생성
  4. 생성된 GIF를 다운로드

## 사용 방법

### 1. 이미지 업로드
- "파일 선택" 버튼을 클릭하거나
- 드래그 앤 드롭 영역에 이미지 파일을 끌어다 놓기
- JPG, PNG, GIF 형식 지원

### 2. 프레임 관리
- 업로드된 이미지를 드래그하여 순서 변경
- 각 프레임의 X 버튼을 클릭하여 삭제
- "모두 삭제" 버튼으로 전체 프레임 초기화

### 3. GIF 설정
- **프레임 지연 시간**: 각 프레임이 표시되는 시간 (밀리초, 낮을수록 빠름)
- **반복 횟수**: GIF 반복 재생 횟수 (0 = 무한 반복)
- **GIF 너비**: 생성될 GIF의 너비 (픽셀, 높이는 비율 유지)
- **품질**: 1-30 사이 값 (낮을수록 고품질, 처리 시간 증가)

### 4. GIF 생성 및 다운로드
- "GIF 생성하기" 버튼 클릭
- 생성 진행 상황 확인
- 완성된 GIF 미리보기
- "다운로드" 버튼으로 저장

## 로컬 개발

### 필수 요구사항
- Node.js (v18 이상)
- npm

### 설치 및 실행

```bash
# 의존성 설치 (이미 설치됨)
npm install

# 프로젝트 빌드
npm run build

# PM2로 개발 서버 시작
pm2 start ecosystem.config.cjs

# 서비스 상태 확인
pm2 list

# 로그 확인
pm2 logs webapp --nostream

# 서비스 중지
pm2 delete webapp
```

### 포트 관리

```bash
# 포트 3000 정리
npm run clean-port

# 서비스 테스트
npm run test
# 또는
curl http://localhost:3000
```

## Cloudflare Pages 배포

### 배포 전 준비

1. **Cloudflare API 키 설정**
   - Deploy 탭에서 Cloudflare API 키 설정 필요

2. **프로젝트 빌드**
   ```bash
   npm run build
   ```

### 프로덕션 배포

```bash
# Cloudflare Pages에 배포
npm run deploy:prod
```

## 완성된 기능

- ✅ 다중 이미지 업로드 (드래그 앤 드롭)
- ✅ 프레임 순서 변경 (드래그 앤 드롭)
- ✅ 개별 프레임 삭제
- ✅ 전체 프레임 초기화
- ✅ 프레임 지연 시간 설정
- ✅ GIF 반복 횟수 설정
- ✅ GIF 크기 조정 (너비 기준, 비율 유지)
- ✅ GIF 품질 설정
- ✅ 실시간 진행 상황 표시
- ✅ 생성된 GIF 미리보기
- ✅ GIF 다운로드
- ✅ 파일 크기 표시

## 향후 개선 사항

- [ ] 개별 프레임별 지연 시간 설정
- [ ] 프레임 복제 기능
- [ ] 이미지 크롭/트리밍 기능
- [ ] 텍스트 오버레이 추가
- [ ] 필터 효과 (흑백, 세피아 등)
- [ ] 프레임 간 크로스페이드 효과
- [ ] GIF 압축 최적화
- [ ] 생성 기록 저장 (로컬 스토리지)
- [ ] 비디오 → GIF 변환 기능

## 라이선스

MIT License

---

© 2025 GIF Maker. Made with Hono + Cloudflare Pages
