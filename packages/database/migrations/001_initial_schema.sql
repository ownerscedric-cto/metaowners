-- Initial Schema for Meta Ads Platform
-- Version: 001
-- Date: 2024-01-29

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Facebook ad accounts table
CREATE TABLE IF NOT EXISTS ad_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  account_id text UNIQUE NOT NULL,
  account_name text,
  access_token text, -- Should be encrypted in production
  refresh_token text,
  token_expires_at timestamp with time zone,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  currency text DEFAULT 'USD',
  timezone_name text DEFAULT 'America/Los_Angeles',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id text REFERENCES ad_accounts(account_id) ON DELETE CASCADE,
  campaign_id text UNIQUE NOT NULL,
  campaign_name text,
  objective text,
  status text,
  daily_budget decimal(10,2),
  lifetime_budget decimal(10,2),
  created_time timestamp with time zone,
  updated_time timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Campaign insights table (for time-series data)
CREATE TABLE IF NOT EXISTS campaign_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id text,
  campaign_id text NOT NULL,
  campaign_name text,
  date_start date NOT NULL,
  date_stop date,
  impressions bigint DEFAULT 0,
  reach bigint DEFAULT 0,
  frequency decimal(10,4) DEFAULT 0,
  spend decimal(10,2) DEFAULT 0,
  clicks bigint DEFAULT 0,
  cpm decimal(10,4) DEFAULT 0,
  cpc decimal(10,4) DEFAULT 0,
  ctr decimal(10,4) DEFAULT 0,
  conversions bigint DEFAULT 0,
  conversion_value decimal(10,2) DEFAULT 0,
  cost_per_conversion decimal(10,4) DEFAULT 0,
  roas decimal(10,4) DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(campaign_id, date_start)
);

-- Alerts configuration table
CREATE TABLE IF NOT EXISTS alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  account_id text REFERENCES ad_accounts(account_id) ON DELETE CASCADE,
  rule_name text NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN ('spend', 'performance', 'status')),
  metric text NOT NULL,
  operator text NOT NULL CHECK (operator IN ('>', '<', '>=', '<=', '=')),
  threshold decimal(10,4),
  is_active boolean DEFAULT true,
  last_triggered_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Alert history table
CREATE TABLE IF NOT EXISTS alert_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES alert_rules(id) ON DELETE CASCADE,
  triggered_value decimal(10,4),
  message text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_ad_accounts_user_id ON ad_accounts(user_id);
CREATE INDEX idx_campaigns_account_id ON campaigns(account_id);
CREATE INDEX idx_campaign_insights_campaign_id ON campaign_insights(campaign_id);
CREATE INDEX idx_campaign_insights_date_start ON campaign_insights(date_start DESC);
CREATE INDEX idx_campaign_insights_account_date ON campaign_insights(account_id, date_start DESC);
CREATE INDEX idx_alert_rules_user_id ON alert_rules(user_id);
CREATE INDEX idx_alert_history_rule_id ON alert_history(rule_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_accounts_updated_at BEFORE UPDATE ON ad_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_insights_updated_at BEFORE UPDATE ON campaign_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at BEFORE UPDATE ON alert_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - to be refined based on auth strategy)
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can only see their own ad accounts
CREATE POLICY "Users can view own ad accounts" ON ad_accounts
  FOR ALL USING (user_id = auth.uid());

-- Users can see campaigns for their ad accounts
CREATE POLICY "Users can view own campaigns" ON campaigns
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM ad_accounts WHERE user_id = auth.uid()
    )
  );

-- Users can see insights for their campaigns
CREATE POLICY "Users can view own insights" ON campaign_insights
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM ad_accounts WHERE user_id = auth.uid()
    )
  );

-- Users can manage their own alert rules
CREATE POLICY "Users can manage own alerts" ON alert_rules
  FOR ALL USING (user_id = auth.uid());

-- Users can see their own alert history
CREATE POLICY "Users can view own alert history" ON alert_history
  FOR SELECT USING (
    rule_id IN (
      SELECT id FROM alert_rules WHERE user_id = auth.uid()
    )
  );