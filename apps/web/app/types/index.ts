// 공통 타입 정의

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export interface AdAccount {
  id: string;
  name: string;
  account_id: string;
  currency: string;
  timezone_name: string;
  account_status: number;
}

export interface Campaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  daily_budget: string;
  created_time: string;
}

export interface AdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
  daily_budget: string;
  targeting: {
    age_min: number;
    age_max: number;
    genders: number[];
    geo_locations: {
      countries: string[];
    };
  };
  created_time: string;
}

export interface Ad {
  id: string;
  name: string;
  adset_id: string;
  status: string;
  creative: {
    title: string;
    body: string;
    call_to_action_type: string;
    image_url?: string;
  };
  created_time: string;
}

export interface AdInsights {
  ad_id: string;
  date_start: string;
  date_stop: string;
  impressions: number;
  clicks: number;
  spend: number;
  cpm: number;
  cpc: number;
  ctr: number;
  reach: number;
  clicks: number;
  conversions: number;
}