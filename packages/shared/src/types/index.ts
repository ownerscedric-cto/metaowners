// Shared Types for Meta Ads Platform

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AdAccount {
  id: string;
  user_id: string;
  account_id: string;
  account_name?: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: Date;
  status: 'active' | 'inactive' | 'error';
  currency: string;
  timezone_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Campaign {
  id: string;
  account_id: string;
  campaign_id: string;
  campaign_name?: string;
  objective?: string;
  status?: string;
  daily_budget?: number;
  lifetime_budget?: number;
  created_time?: Date;
  updated_time?: Date;
  created_at: Date;
}

export interface CampaignInsights {
  id: string;
  account_id?: string;
  campaign_id: string;
  campaign_name?: string;
  date_start: Date;
  date_stop?: Date;
  impressions: number;
  reach: number;
  frequency: number;
  spend: number;
  clicks: number;
  cpm: number;
  cpc: number;
  ctr: number;
  conversions?: number;
  conversion_value?: number;
  cost_per_conversion?: number;
  roas?: number;
  created_at: Date;
  updated_at: Date;
}

export interface AlertRule {
  id: string;
  user_id: string;
  account_id?: string;
  rule_name: string;
  rule_type: 'spend' | 'performance' | 'status';
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '=';
  threshold: number;
  is_active: boolean;
  last_triggered_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AlertHistory {
  id: string;
  rule_id: string;
  triggered_value: number;
  message?: string;
  is_read: boolean;
  created_at: Date;
}

// Meta API Response Types
export interface MetaInsightsResponse {
  data: Array<{
    impressions: string;
    reach: string;
    frequency: string;
    spend: string;
    clicks: string;
    cpm: string;
    cpc: string;
    ctr: string;
    date_start: string;
    date_stop: string;
    campaign_id?: string;
    campaign_name?: string;
    conversions?: Array<{
      action_type: string;
      value: string;
    }>;
    cost_per_conversion?: Array<{
      action_type: string;
      value: string;
    }>;
  }>;
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
}

export interface MetaCampaignResponse {
  id: string;
  name: string;
  objective: string;
  status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time: string;
  updated_time: string;
}

export interface MetaError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id: string;
}

// Request Types
export interface DateRange {
  since: string; // YYYY-MM-DD
  until: string; // YYYY-MM-DD
}

export interface InsightsRequest {
  account_id: string;
  level?: 'account' | 'campaign' | 'adset' | 'ad';
  fields?: string[];
  time_range?: DateRange;
  time_increment?: number | 'monthly' | 'all_days';
  breakdowns?: string[];
  limit?: number;
}