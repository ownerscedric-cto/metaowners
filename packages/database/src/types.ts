// TypeScript types for all database tables

// ============================================================================
// 기본 공통 타입들
// ============================================================================
export interface BaseTable {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseResponse<T> {
  data: T | null;
  error: any;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortOptions {
  column: string;
  ascending?: boolean;
}

// ============================================================================
// 사용자 관련 타입들
// ============================================================================
export interface User extends BaseTable {
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export interface CreateUserInput {
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface UpdateUserInput {
  name?: string;
  avatar_url?: string;
}

// ============================================================================
// 광고 계정 관련 타입들
// ============================================================================
export interface AdAccount extends BaseTable {
  user_id: string;
  account_id: string;
  account_name: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  status: 'active' | 'inactive' | 'error';
  currency: string;
  timezone_name: string;
}

export interface CreateAdAccountInput {
  user_id: string;
  account_id: string;
  account_name?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  status?: 'active' | 'inactive' | 'error';
  currency?: string;
  timezone_name?: string;
}

// ============================================================================
// 템플릿 관련 타입들
// ============================================================================
export interface Template extends BaseTable {
  user_id: string;
  template_name: string;
  template_type: 'campaign' | 'adset' | 'ad';
  template_data: Record<string, any>;
  category: string | null;
  description: string | null;
  tags: string[];
  is_active: boolean;
  usage_count: number;
}

export interface CreateTemplateInput {
  user_id: string;
  template_name: string;
  template_type: 'campaign' | 'adset' | 'ad';
  template_data: Record<string, any>;
  category?: string;
  description?: string;
  tags?: string[];
  is_active?: boolean;
}

export interface UpdateTemplateInput {
  template_name?: string;
  template_data?: Record<string, any>;
  category?: string;
  description?: string;
  tags?: string[];
  is_active?: boolean;
}

// ============================================================================
// 캠페인 관련 타입들
// ============================================================================
export interface Campaign extends BaseTable {
  account_id: string;
  campaign_id: string;
  campaign_name: string | null;
  objective: string | null;
  status: string | null;
  daily_budget: number | null;
  lifetime_budget: number | null;
  created_time: string | null;
  updated_time: string | null;
}

export interface CampaignInsights extends BaseTable {
  account_id: string | null;
  campaign_id: string;
  campaign_name: string | null;
  date_start: string;
  date_stop: string | null;
  impressions: number;
  reach: number;
  frequency: number;
  spend: number;
  clicks: number;
  cpm: number;
  cpc: number;
  ctr: number;
  conversions: number;
  conversion_value: number;
  cost_per_conversion: number;
  roas: number;
}

// ============================================================================
// 광고세트 관련 타입들
// ============================================================================
export interface AdSet extends BaseTable {
  account_id: string;
  campaign_id: string;
  adset_id: string;
  adset_name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  daily_budget: number | null;
  lifetime_budget: number | null;
  optimization_goal: string | null;
  billing_event: string | null;
  bid_amount: number | null;
  targeting: Record<string, any> | null;
  start_time: string | null;
  end_time: string | null;
  created_time: string | null;
  updated_time: string | null;
}

export interface CreateAdSetInput {
  account_id: string;
  campaign_id: string;
  adset_id: string;
  adset_name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  daily_budget?: number;
  lifetime_budget?: number;
  optimization_goal?: string;
  billing_event?: string;
  bid_amount?: number;
  targeting?: Record<string, any>;
  start_time?: string;
  end_time?: string;
  created_time?: string;
  updated_time?: string;
}

// ============================================================================
// 광고 관련 타입들
// ============================================================================
export interface Ad extends BaseTable {
  account_id: string;
  campaign_id: string;
  adset_id: string;
  ad_id: string;
  ad_name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  creative: Record<string, any>;
  tracking_specs: Record<string, any> | null;
  conversion_specs: Record<string, any> | null;
  created_time: string | null;
  updated_time: string | null;
}

export interface CreateAdInput {
  account_id: string;
  campaign_id: string;
  adset_id: string;
  ad_id: string;
  ad_name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  creative: Record<string, any>;
  tracking_specs?: Record<string, any>;
  conversion_specs?: Record<string, any>;
  created_time?: string;
  updated_time?: string;
}

// ============================================================================
// 미디어 자산 관련 타입들
// ============================================================================
export interface MediaAsset extends BaseTable {
  user_id: string;
  asset_name: string;
  asset_type: 'image' | 'video' | 'document';
  file_url: string;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  dimensions: { width: number; height: number } | null;
  duration: number | null; // 비디오 길이 (초)
  alt_text: string | null;
  tags: string[];
  metadata: Record<string, any>;
  is_approved: boolean;
  facebook_hash: string | null;
  usage_count: number;
}

export interface CreateMediaAssetInput {
  user_id: string;
  asset_name: string;
  asset_type: 'image' | 'video' | 'document';
  file_url: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  alt_text?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  is_approved?: boolean;
  facebook_hash?: string;
}

// ============================================================================
// 자동화 규칙 관련 타입들
// ============================================================================
export interface AutomationRule extends BaseTable {
  user_id: string;
  account_id: string;
  rule_name: string;
  rule_type: 'cost_control' | 'performance' | 'schedule' | 'bid_adjustment';
  target_type: 'campaign' | 'adset' | 'ad';
  target_ids: string[];
  conditions: Record<string, any>;
  actions: Record<string, any>;
  schedule: Record<string, any> | null;
  is_active: boolean;
  last_executed_at: string | null;
  execution_count: number;
}

export interface CreateAutomationRuleInput {
  user_id: string;
  account_id: string;
  rule_name: string;
  rule_type: 'cost_control' | 'performance' | 'schedule' | 'bid_adjustment';
  target_type: 'campaign' | 'adset' | 'ad';
  target_ids?: string[];
  conditions: Record<string, any>;
  actions: Record<string, any>;
  schedule?: Record<string, any>;
  is_active?: boolean;
}

// ============================================================================
// 대량 업로드 관련 타입들
// ============================================================================
export interface BulkUpload extends BaseTable {
  user_id: string;
  account_id: string;
  upload_name: string;
  upload_type: 'campaigns' | 'adsets' | 'ads' | 'mixed';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  source_data: Record<string, any> | null;
  results: Record<string, any>;
  error_details: Record<string, any>;
  started_at: string | null;
  completed_at: string | null;
}

export interface CreateBulkUploadInput {
  user_id: string;
  account_id: string;
  upload_name: string;
  upload_type: 'campaigns' | 'adsets' | 'ads' | 'mixed';
  total_items: number;
  source_data?: Record<string, any>;
}

export interface UpdateBulkUploadInput {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  processed_items?: number;
  successful_items?: number;
  failed_items?: number;
  results?: Record<string, any>;
  error_details?: Record<string, any>;
  started_at?: string;
  completed_at?: string;
}

// ============================================================================
// 예약 작업 관련 타입들
// ============================================================================
export interface ScheduledTask extends BaseTable {
  user_id: string;
  account_id: string | null;
  task_name: string;
  task_type: 'campaign_start' | 'campaign_pause' | 'budget_update' | 'bid_update' | 'report_generation';
  task_data: Record<string, any>;
  schedule_time: string;
  recurrence: string | null; // cron expression
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  retry_count: number;
  max_retries: number;
  last_attempt_at: string | null;
  completed_at: string | null;
  result: Record<string, any> | null;
  error_message: string | null;
}

export interface CreateScheduledTaskInput {
  user_id: string;
  account_id?: string;
  task_name: string;
  task_type: 'campaign_start' | 'campaign_pause' | 'budget_update' | 'bid_update' | 'report_generation';
  task_data: Record<string, any>;
  schedule_time: string;
  recurrence?: string;
  max_retries?: number;
}

// ============================================================================
// 활동 로그 관련 타입들
// ============================================================================
export interface ActivityLog {
  id: string;
  user_id: string | null;
  account_id: string | null;
  action: string;
  entity_type: 'user' | 'account' | 'campaign' | 'adset' | 'ad' | 'template' | 'automation_rule' | 'bulk_upload';
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  api_endpoint: string | null;
  created_at: string;
}

export interface CreateActivityLogInput {
  user_id?: string;
  account_id?: string;
  action: string;
  entity_type: 'user' | 'account' | 'campaign' | 'adset' | 'ad' | 'template' | 'automation_rule' | 'bulk_upload';
  entity_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  api_endpoint?: string;
}

// ============================================================================
// 뷰 타입들
// ============================================================================
export interface AdHierarchy {
  campaign_id: string | null;
  campaign_name: string | null;
  campaign_status: string | null;
  campaign_budget: number | null;
  adset_id: string | null;
  adset_name: string | null;
  adset_status: string | null;
  adset_budget: number | null;
  ad_id: string | null;
  ad_name: string | null;
  ad_status: string | null;
  creative: Record<string, any> | null;
  account_id: string | null;
  campaign_created_time: string | null;
  adset_created_time: string | null;
  ad_created_time: string | null;
}

export interface UserStatistics {
  user_id: string;
  name: string | null;
  email: string;
  total_accounts: number;
  total_campaigns: number;
  total_adsets: number;
  total_ads: number;
  total_templates: number;
  total_media_assets: number;
  total_automation_rules: number;
  user_created_at: string;
}

// ============================================================================
// 필터링 및 검색 타입들
// ============================================================================
export interface TemplateFilters {
  user_id?: string;
  template_type?: 'campaign' | 'adset' | 'ad';
  category?: string;
  is_active?: boolean;
  tags?: string[];
}

export interface MediaAssetFilters {
  user_id?: string;
  asset_type?: 'image' | 'video' | 'document';
  is_approved?: boolean;
  tags?: string[];
}

export interface AdFilters {
  account_id?: string;
  campaign_id?: string;
  adset_id?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
}

export interface BulkUploadFilters {
  user_id?: string;
  account_id?: string;
  upload_type?: 'campaigns' | 'adsets' | 'ads' | 'mixed';
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
}

// ============================================================================
// API 응답 타입들
// ============================================================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// 에러 타입들
// ============================================================================
export interface DatabaseError {
  code: string;
  message: string;
  details?: Record<string, any>;
  hint?: string;
}