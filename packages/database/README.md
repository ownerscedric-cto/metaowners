# Meta Ads Platform Database

메타 광고 플랫폼을 위한 Supabase 데이터베이스 패키지입니다.

## 📋 목차

- [설치 및 설정](#설치-및-설정)
- [데이터베이스 구조](#데이터베이스-구조)
- [마이그레이션](#마이그레이션)
- [사용법](#사용법)
- [API 참조](#api-참조)

## 🚀 설치 및 설정

### 1. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env.local` 파일을 생성하고 필요한 값들을 설정하세요.

```bash
cp .env.example .env.local
```

필수 환경 변수:
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY`: 클라이언트용 익명 키
- `SUPABASE_SERVICE_ROLE_KEY`: 서버용 서비스 키 (마이그레이션용)

### 2. 의존성 설치

```bash
npm install
```

### 3. 데이터베이스 마이그레이션

```bash
# 모든 마이그레이션 실행
npm run migrate

# 특정 마이그레이션 파일만 실행
npm run migrate 001_initial_schema.sql
```

### 4. 샘플 데이터 시딩

```bash
# 전체 샘플 데이터 생성
npm run seed

# 특정 테이블만 시딩
npm run seed users
npm run seed templates
```

## 🗄️ 데이터베이스 구조

### 기본 테이블 (001_initial_schema.sql)

- **users**: 사용자 정보
- **ad_accounts**: Facebook 광고 계정
- **campaigns**: 광고 캠페인
- **campaign_insights**: 캠페인 성과 데이터
- **alert_rules**: 알림 규칙
- **alert_history**: 알림 기록

### 고급 관리 테이블 (002_ad_management_tables.sql)

- **templates**: 재사용 가능한 광고 템플릿
- **ad_sets**: 광고세트 정보
- **ads**: 개별 광고 정보
- **media_assets**: 미디어 자산 (이미지/비디오)
- **automation_rules**: 자동화 규칙
- **bulk_uploads**: 대량 업로드 추적
- **scheduled_tasks**: 예약 작업
- **activity_logs**: 활동 로그

### 뷰 (Views)

- **ad_hierarchy**: 캠페인 → 광고세트 → 광고 계층 구조
- **user_statistics**: 사용자별 통계

## 🔄 마이그레이션

### 마이그레이션 실행

```bash
# 모든 마이그레이션 실행
node scripts/migrate.js

# 특정 마이그레이션 실행
node scripts/migrate.js 002_ad_management_tables.sql
```

### 데이터베이스 리셋

```bash
# 전체 데이터베이스 리셋
node scripts/reset.js

# 특정 테이블만 리셋
node scripts/reset.js --tables users templates

# 현재 상태 확인
node scripts/reset.js --stats

# 확인 프롬프트와 함께 리셋
node scripts/reset.js --confirm
```

### 샘플 데이터 시딩

```bash
# 전체 시딩
node scripts/seed.js

# 특정 테이블 시딩
node scripts/seed.js users
node scripts/seed.js templates
```

## 💻 사용법

### 기본 클라이언트 사용

```typescript
import { getSupabaseClient, userQueries } from '@metaowners/database';

// 클라이언트 생성
const supabase = getSupabaseClient();

// 사용자 조회
const { data: user } = await userQueries.getById('user-id');

// 사용자 생성
const { data: newUser } = await userQueries.create({
  email: 'user@example.com',
  name: '사용자명'
});
```

### 템플릿 관리

```typescript
import { templateQueries } from '@metaowners/database';

// 사용자의 템플릿 목록 조회
const templates = await templateQueries.getByUserId('user-id', {
  template_type: 'campaign',
  is_active: true
});

// 새 템플릿 생성
const newTemplate = await templateQueries.create({
  user_id: 'user-id',
  template_name: '이커머스 캠페인 템플릿',
  template_type: 'campaign',
  template_data: {
    objective: 'CONVERSIONS',
    daily_budget: 50000
  }
});
```

### 미디어 자산 관리

```typescript
import { mediaAssetQueries } from '@metaowners/database';

// 미디어 자산 업로드
const asset = await mediaAssetQueries.create({
  user_id: 'user-id',
  asset_name: '제품 이미지',
  asset_type: 'image',
  file_url: 'https://example.com/image.jpg',
  dimensions: { width: 1200, height: 630 },
  tags: ['제품', '이커머스']
});
```

### 대량 업로드 추적

```typescript
import { bulkUploadQueries } from '@metaowners/database';

// 대량 업로드 작업 생성
const bulkUpload = await bulkUploadQueries.create({
  user_id: 'user-id',
  account_id: 'act_123456789',
  upload_name: '2024년 봄 캠페인 업로드',
  upload_type: 'campaigns',
  total_items: 50
});

// 진행 상황 업데이트
await bulkUploadQueries.update(bulkUpload.data!.id, {
  status: 'processing',
  processed_items: 25,
  successful_items: 23,
  failed_items: 2
});
```

### 실시간 구독

```typescript
import { subscribeToTable } from '@metaowners/database';

// 대량 업로드 상태 변경 구독
const unsubscribe = subscribeToTable(
  'bulk_uploads',
  (payload) => {
    console.log('업로드 상태 변경:', payload);
  },
  `user_id=eq.${userId}`
);

// 구독 해제
unsubscribe();
```

## 📚 API 참조

### 클라이언트 함수

- `getSupabaseClient()`: 일반 클라이언트 인스턴스
- `getSupabaseAdminClient()`: 관리자 클라이언트 인스턴스
- `checkConnection()`: 연결 상태 확인
- `healthCheck()`: 전체 헬스 체크

### 쿼리 모듈

- `userQueries`: 사용자 관련 쿼리
- `adAccountQueries`: 광고 계정 쿼리
- `templateQueries`: 템플릿 쿼리
- `adSetQueries`: 광고세트 쿼리
- `adQueries`: 광고 쿼리
- `mediaAssetQueries`: 미디어 자산 쿼리
- `automationRuleQueries`: 자동화 규칙 쿼리
- `bulkUploadQueries`: 대량 업로드 쿼리
- `scheduledTaskQueries`: 예약 작업 쿼리
- `activityLogQueries`: 활동 로그 쿼리
- `viewQueries`: 뷰 쿼리

### 유틸리티 함수

- `logActivity()`: 활동 로그 기록
- `validateEmail()`: 이메일 검증
- `formatCurrency()`: 통화 형식화
- `analyzePerformance()`: 성과 분석
- `createBackup()`: 데이터 백업

## 🔒 보안

### Row Level Security (RLS)

모든 테이블에 RLS가 활성화되어 있으며, 사용자는 자신의 데이터만 접근할 수 있습니다.

### 데이터 암호화

- 액세스 토큰은 암호화되어 저장됩니다
- 민감한 정보는 환경 변수로 관리됩니다

## 🛠️ 개발

### 새 마이그레이션 추가

1. `migrations/` 폴더에 새 SQL 파일 생성 (번호 순서대로)
2. 마이그레이션 실행: `npm run migrate`

### 새 쿼리 함수 추가

1. `src/queries.ts`에 새 쿼리 함수 추가
2. 필요시 `src/types.ts`에 타입 정의 추가
3. `src/index.ts`에서 내보내기

## 🐛 문제 해결

### 연결 오류

1. 환경 변수가 올바르게 설정되었는지 확인
2. Supabase 프로젝트가 활성 상태인지 확인
3. 네트워크 연결 상태 확인

### 마이그레이션 실패

1. SQL 문법 오류 확인
2. 테이블/컬럼 이름 충돌 확인
3. 권한 설정 확인 (SERVICE_ROLE_KEY 필요)

### RLS 정책 오류

1. 사용자 인증 상태 확인
2. 정책 조건 검토
3. 테이블 권한 확인

## 📞 지원

문제가 발생하면 다음을 확인해주세요:

1. [Supabase 문서](https://supabase.com/docs)
2. 프로젝트 이슈 트래커
3. 팀 Slack 채널

---

**Meta Ads Platform Database v1.0.0**
마지막 업데이트: 2024년 10월 30일