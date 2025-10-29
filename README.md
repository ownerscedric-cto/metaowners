# Meta Owners - 실시간 광고 분석 대시보드

Meta Marketing API를 활용한 실시간 광고 성과 모니터링 및 분석 플랫폼

## 🚀 프로젝트 개요

실시간으로 Facebook/Instagram 광고 캠페인의 성과를 모니터링하고 분석할 수 있는 웹 애플리케이션입니다.

### 핵심 기능
- 📊 **실시간 성과 모니터링**: 노출량, 도달량, 지출, 클릭 등 주요 지표
- 💰 **예산 관리**: 설정 예산 대비 실제 지출 추적
- 📈 **트렌드 분석**: 시간별/일별 성과 변화 추이
- 🔔 **알림 시스템**: 임계값 도달 시 실시간 알림

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: Supabase (PostgreSQL)
- **API**: Meta Marketing API
- **Real-time**: Supabase Realtime, WebSocket
- **Charts**: Chart.js, Recharts

## 📁 프로젝트 구조

```
metaowners/
├── apps/
│   ├── web/              # Next.js 프론트엔드
│   └── api/              # Express 백엔드
├── packages/
│   ├── database/         # Supabase 스키마 & 마이그레이션
│   └── shared/           # 공유 타입 & 유틸리티
└── docs/                 # 프로젝트 문서
```

## 🚀 시작하기

### 사전 요구사항
- Node.js 18+
- npm 또는 yarn
- Supabase 계정
- Facebook 개발자 계정

### 설치

```bash
# 저장소 클론
git clone https://github.com/ownerscedric-cto/metaowners.git
cd metaowners

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 필요한 API 키 입력
```

### 개발 서버 실행

```bash
# 전체 실행
npm run dev

# 개별 실행
npm run dev:web    # 프론트엔드
npm run dev:api    # 백엔드
```

## 📝 환경변수 설정

`.env` 파일에 다음 변수들을 설정해주세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Facebook
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
```

## 📊 데이터베이스 스키마

주요 테이블:
- `users` - 사용자 계정
- `ad_accounts` - Facebook 광고 계정
- `campaign_insights` - 캠페인 성과 데이터

## 🤝 기여하기

기여는 언제나 환영입니다! PR을 제출해주세요.

## 📄 라이선스

MIT

## 📞 문의

문제가 있거나 질문이 있으시면 이슈를 생성해주세요.