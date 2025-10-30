-- Advanced Ad Management Tables for Meta Ads Platform
-- Version: 002
-- Date: 2024-10-30
-- Purpose: 광고 자동 업로드 및 관리 기능을 위한 고급 테이블들

-- ============================================================================
-- 1. 템플릿 테이블 (재사용 가능한 광고 템플릿)
-- ============================================================================
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  template_name text NOT NULL,
  template_type text NOT NULL CHECK (template_type IN ('campaign', 'adset', 'ad')),
  template_data jsonb NOT NULL,
  category text,
  description text,
  tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 2. 광고세트 테이블 (Facebook Ad Sets 확장)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ad_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id text REFERENCES ad_accounts(account_id) ON DELETE CASCADE NOT NULL,
  campaign_id text NOT NULL,
  adset_id text UNIQUE NOT NULL,
  adset_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED')),
  daily_budget decimal(10,2),
  lifetime_budget decimal(10,2),
  optimization_goal text,
  billing_event text,
  bid_amount decimal(10,4),
  targeting jsonb,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  created_time timestamp with time zone,
  updated_time timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 3. 광고 테이블 (Facebook Ads 확장)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id text NOT NULL,
  campaign_id text NOT NULL,
  adset_id text REFERENCES ad_sets(adset_id) ON DELETE CASCADE NOT NULL,
  ad_id text UNIQUE NOT NULL,
  ad_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED')),
  creative jsonb NOT NULL,
  tracking_specs jsonb,
  conversion_specs jsonb,
  created_time timestamp with time zone,
  updated_time timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 4. 미디어 자산 테이블 (이미지/비디오 관리)
-- ============================================================================
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  asset_name text NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('image', 'video', 'document')),
  file_url text NOT NULL,
  file_path text,
  file_size bigint,
  mime_type text,
  dimensions jsonb, -- {width: number, height: number}
  duration integer, -- 비디오 길이 (초)
  alt_text text,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  is_approved boolean DEFAULT false,
  facebook_hash text, -- Facebook 업로드시 생성되는 해시
  usage_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 5. 자동화 규칙 테이블 (성과 기반 자동화)
-- ============================================================================
CREATE TABLE IF NOT EXISTS automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  account_id text REFERENCES ad_accounts(account_id) ON DELETE CASCADE NOT NULL,
  rule_name text NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN ('cost_control', 'performance', 'schedule', 'bid_adjustment')),
  target_type text NOT NULL CHECK (target_type IN ('campaign', 'adset', 'ad')),
  target_ids text[] DEFAULT '{}', -- 적용할 대상 ID들
  conditions jsonb NOT NULL, -- 실행 조건
  actions jsonb NOT NULL, -- 실행할 액션
  schedule jsonb, -- 실행 스케줄
  is_active boolean DEFAULT true,
  last_executed_at timestamp with time zone,
  execution_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 6. 대량 업로드 테이블 (Bulk Upload 추적)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bulk_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  account_id text REFERENCES ad_accounts(account_id) ON DELETE CASCADE NOT NULL,
  upload_name text NOT NULL,
  upload_type text NOT NULL CHECK (upload_type IN ('campaigns', 'adsets', 'ads', 'mixed')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  total_items integer NOT NULL DEFAULT 0,
  processed_items integer DEFAULT 0,
  successful_items integer DEFAULT 0,
  failed_items integer DEFAULT 0,
  source_data jsonb, -- 원본 업로드 데이터
  results jsonb DEFAULT '{}', -- 처리 결과
  error_details jsonb DEFAULT '{}', -- 에러 상세 정보
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 7. 예약 작업 테이블 (Scheduled Tasks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  account_id text REFERENCES ad_accounts(account_id) ON DELETE CASCADE,
  task_name text NOT NULL,
  task_type text NOT NULL CHECK (task_type IN ('campaign_start', 'campaign_pause', 'budget_update', 'bid_update', 'report_generation')),
  task_data jsonb NOT NULL,
  schedule_time timestamp with time zone NOT NULL,
  recurrence text, -- cron expression for recurring tasks
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'running', 'completed', 'failed', 'cancelled')),
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  last_attempt_at timestamp with time zone,
  completed_at timestamp with time zone,
  result jsonb,
  error_message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 8. 활동 로그 테이블 (Comprehensive Audit Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  account_id text REFERENCES ad_accounts(account_id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('user', 'account', 'campaign', 'adset', 'ad', 'template', 'automation_rule', 'bulk_upload')),
  entity_id text,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  api_endpoint text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 인덱스 생성 (성능 최적화)
-- ============================================================================

-- Templates 인덱스
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_type ON templates(template_type);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_active ON templates(is_active) WHERE is_active = true;

-- Ad Sets 인덱스
CREATE INDEX idx_ad_sets_account_id ON ad_sets(account_id);
CREATE INDEX idx_ad_sets_campaign_id ON ad_sets(campaign_id);
CREATE INDEX idx_ad_sets_status ON ad_sets(status);
CREATE INDEX idx_ad_sets_created_time ON ad_sets(created_time DESC);

-- Ads 인덱스
CREATE INDEX idx_ads_account_id ON ads(account_id);
CREATE INDEX idx_ads_campaign_id ON ads(campaign_id);
CREATE INDEX idx_ads_adset_id ON ads(adset_id);
CREATE INDEX idx_ads_status ON ads(status);
CREATE INDEX idx_ads_created_time ON ads(created_time DESC);

-- Media Assets 인덱스
CREATE INDEX idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX idx_media_assets_type ON media_assets(asset_type);
CREATE INDEX idx_media_assets_approved ON media_assets(is_approved);
CREATE INDEX idx_media_assets_tags ON media_assets USING GIN(tags);

-- Automation Rules 인덱스
CREATE INDEX idx_automation_rules_user_id ON automation_rules(user_id);
CREATE INDEX idx_automation_rules_account_id ON automation_rules(account_id);
CREATE INDEX idx_automation_rules_active ON automation_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_automation_rules_type ON automation_rules(rule_type);

-- Bulk Uploads 인덱스
CREATE INDEX idx_bulk_uploads_user_id ON bulk_uploads(user_id);
CREATE INDEX idx_bulk_uploads_account_id ON bulk_uploads(account_id);
CREATE INDEX idx_bulk_uploads_status ON bulk_uploads(status);
CREATE INDEX idx_bulk_uploads_created_at ON bulk_uploads(created_at DESC);

-- Scheduled Tasks 인덱스
CREATE INDEX idx_scheduled_tasks_user_id ON scheduled_tasks(user_id);
CREATE INDEX idx_scheduled_tasks_status ON scheduled_tasks(status);
CREATE INDEX idx_scheduled_tasks_schedule_time ON scheduled_tasks(schedule_time);
CREATE INDEX idx_scheduled_tasks_pending ON scheduled_tasks(schedule_time) WHERE status = 'scheduled';

-- Activity Logs 인덱스
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_account_id ON activity_logs(account_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

-- ============================================================================
-- 업데이트 트리거 적용
-- ============================================================================
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_sets_updated_at BEFORE UPDATE ON ad_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_assets_updated_at BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON automation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bulk_uploads_updated_at BEFORE UPDATE ON bulk_uploads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_tasks_updated_at BEFORE UPDATE ON scheduled_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS) 활성화
-- ============================================================================
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS 정책 생성
-- ============================================================================

-- Templates RLS 정책
CREATE POLICY "Users can manage own templates" ON templates
  FOR ALL USING (user_id = auth.uid());

-- Ad Sets RLS 정책
CREATE POLICY "Users can view own adsets" ON ad_sets
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM ad_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify own adsets" ON ad_sets
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM ad_accounts WHERE user_id = auth.uid()
    )
  );

-- Ads RLS 정책
CREATE POLICY "Users can view own ads" ON ads
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM ad_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify own ads" ON ads
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM ad_accounts WHERE user_id = auth.uid()
    )
  );

-- Media Assets RLS 정책
CREATE POLICY "Users can manage own media assets" ON media_assets
  FOR ALL USING (user_id = auth.uid());

-- Automation Rules RLS 정책
CREATE POLICY "Users can manage own automation rules" ON automation_rules
  FOR ALL USING (user_id = auth.uid());

-- Bulk Uploads RLS 정책
CREATE POLICY "Users can manage own bulk uploads" ON bulk_uploads
  FOR ALL USING (user_id = auth.uid());

-- Scheduled Tasks RLS 정책
CREATE POLICY "Users can manage own scheduled tasks" ON scheduled_tasks
  FOR ALL USING (user_id = auth.uid());

-- Activity Logs RLS 정책 (읽기 전용)
CREATE POLICY "Users can view own activity logs" ON activity_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    account_id IN (
      SELECT account_id FROM ad_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 유용한 뷰 생성
-- ============================================================================

-- 광고 계층 구조 뷰 (Campaign > AdSet > Ad)
CREATE OR REPLACE VIEW ad_hierarchy AS
SELECT
  c.campaign_id,
  c.campaign_name,
  c.status as campaign_status,
  c.daily_budget as campaign_budget,
  ads.adset_id,
  ads.adset_name,
  ads.status as adset_status,
  ads.daily_budget as adset_budget,
  a.ad_id,
  a.ad_name,
  a.status as ad_status,
  a.creative,
  c.account_id,
  c.created_time as campaign_created_time,
  ads.created_time as adset_created_time,
  a.created_time as ad_created_time
FROM campaigns c
LEFT JOIN ad_sets ads ON c.campaign_id = ads.campaign_id
LEFT JOIN ads a ON ads.adset_id = a.adset_id
ORDER BY c.created_time DESC, ads.created_time DESC, a.created_time DESC;

-- 사용자별 통계 뷰
CREATE OR REPLACE VIEW user_statistics AS
SELECT
  u.id as user_id,
  u.name,
  u.email,
  COUNT(DISTINCT aa.account_id) as total_accounts,
  COUNT(DISTINCT c.campaign_id) as total_campaigns,
  COUNT(DISTINCT ads.adset_id) as total_adsets,
  COUNT(DISTINCT a.ad_id) as total_ads,
  COUNT(DISTINCT t.id) as total_templates,
  COUNT(DISTINCT ma.id) as total_media_assets,
  COUNT(DISTINCT ar.id) as total_automation_rules,
  u.created_at as user_created_at
FROM users u
LEFT JOIN ad_accounts aa ON u.id = aa.user_id
LEFT JOIN campaigns c ON aa.account_id = c.account_id
LEFT JOIN ad_sets ads ON c.campaign_id = ads.campaign_id
LEFT JOIN ads a ON ads.adset_id = a.adset_id
LEFT JOIN templates t ON u.id = t.user_id
LEFT JOIN media_assets ma ON u.id = ma.user_id
LEFT JOIN automation_rules ar ON u.id = ar.user_id
GROUP BY u.id, u.name, u.email, u.created_at;

-- ============================================================================
-- 유틸리티 함수들
-- ============================================================================

-- 활동 로그 기록 함수
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id uuid,
  p_account_id text,
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
  INSERT INTO activity_logs (
    user_id, account_id, action, entity_type, entity_id,
    old_values, new_values, metadata
  ) VALUES (
    p_user_id, p_account_id, p_action, p_entity_type, p_entity_id,
    p_old_values, p_new_values, p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 템플릿 사용 횟수 증가 함수
CREATE OR REPLACE FUNCTION increment_template_usage(template_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE templates
  SET usage_count = usage_count + 1,
      updated_at = timezone('utc'::text, now())
  WHERE id = template_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 미디어 자산 사용 횟수 증가 함수
CREATE OR REPLACE FUNCTION increment_asset_usage(asset_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE media_assets
  SET usage_count = usage_count + 1,
      updated_at = timezone('utc'::text, now())
  WHERE id = asset_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;