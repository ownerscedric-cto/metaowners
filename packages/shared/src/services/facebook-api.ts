// Facebook Marketing API Service
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { MetaInsightsResponse, MetaCampaignResponse, InsightsRequest, DateRange } from '../types';

export class FacebookAPIService {
  private api: AxiosInstance;
  private accessToken: string;
  private readonly baseURL = 'https://graph.facebook.com/v18.0';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include access token
    this.api.interceptors.request.use((config) => {
      config.params = {
        ...config.params,
        access_token: this.accessToken,
      };
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Facebook API Error:', error.response?.data || error.message);
        throw new Error(
          error.response?.data?.error?.message ||
          'Facebook API request failed'
        );
      }
    );
  }

  /**
   * Get user's ad accounts
   */
  async getAdAccounts(): Promise<any[]> {
    try {
      const response = await this.api.get('/me/adaccounts', {
        params: {
          fields: 'id,name,account_id,currency,timezone_name,account_status',
          limit: 100
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching ad accounts:', error);
      throw error;
    }
  }

  /**
   * Get campaigns for an ad account
   */
  async getCampaigns(accountId: string): Promise<MetaCampaignResponse[]> {
    try {
      const response = await this.api.get(`/act_${accountId}/campaigns`, {
        params: {
          fields: 'id,name,objective,status,daily_budget,lifetime_budget,created_time,updated_time',
          limit: 100
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  }

  /**
   * Get insights for campaigns
   */
  async getCampaignInsights(
    accountId: string,
    options: Partial<InsightsRequest> = {}
  ): Promise<MetaInsightsResponse> {
    try {
      const {
        level = 'campaign',
        fields = [
          'impressions',
          'reach',
          'frequency',
          'spend',
          'clicks',
          'cpm',
          'cpc',
          'ctr',
          'conversions',
          'cost_per_conversion'
        ],
        time_range,
        time_increment = 1,
        breakdowns = [],
        limit = 100
      } = options;

      const params: any = {
        level,
        fields: fields.join(','),
        limit,
        time_increment
      };

      // Add time range if specified
      if (time_range) {
        params.time_range = JSON.stringify(time_range);
      }

      // Add breakdowns if specified
      if (breakdowns.length > 0) {
        params.breakdowns = breakdowns.join(',');
      }

      const response = await this.api.get(`/act_${accountId}/insights`, {
        params
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching insights:', error);
      throw error;
    }
  }

  /**
   * Get insights for specific campaign
   */
  async getSpecificCampaignInsights(
    campaignId: string,
    dateRange?: DateRange
  ): Promise<MetaInsightsResponse> {
    try {
      const params: any = {
        fields: 'impressions,reach,frequency,spend,clicks,cpm,cpc,ctr,conversions,cost_per_conversion,campaign_name',
        time_increment: 1
      };

      if (dateRange) {
        params.time_range = JSON.stringify(dateRange);
      }

      const response = await this.api.get(`/${campaignId}/insights`, {
        params
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching campaign insights:', error);
      throw error;
    }
  }

  /**
   * Get ad sets for a campaign
   */
  async getAdSets(campaignId: string): Promise<any[]> {
    try {
      const response = await this.api.get(`/${campaignId}/adsets`, {
        params: {
          fields: 'id,name,campaign_id,status,daily_budget,optimization_goal,billing_event,targeting,created_time',
          limit: 100
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching ad sets:', error);
      throw error;
    }
  }

  /**
   * Get ads for an ad set
   */
  async getAds(adSetId: string): Promise<any[]> {
    try {
      const response = await this.api.get(`/${adSetId}/ads`, {
        params: {
          fields: 'id,name,adset_id,status,creative,created_time',
          limit: 100
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching ads:', error);
      throw error;
    }
  }

  /**
   * Get insights for an ad set
   */
  async getAdSetInsights(
    adSetId: string,
    dateRange?: DateRange
  ): Promise<MetaInsightsResponse> {
    try {
      const params: any = {
        fields: 'impressions,reach,frequency,spend,clicks,cpm,cpc,ctr,conversions,cost_per_conversion',
        time_increment: 1
      };

      if (dateRange) {
        params.time_range = JSON.stringify(dateRange);
      }

      const response = await this.api.get(`/${adSetId}/insights`, {
        params
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching ad set insights:', error);
      throw error;
    }
  }

  /**
   * Get insights for an individual ad
   */
  async getAdInsights(
    adId: string,
    dateRange?: DateRange
  ): Promise<MetaInsightsResponse> {
    try {
      const params: any = {
        fields: 'impressions,reach,frequency,spend,clicks,cpm,cpc,ctr,conversions,cost_per_conversion',
        time_increment: 1
      };

      if (dateRange) {
        params.time_range = JSON.stringify(dateRange);
      }

      const response = await this.api.get(`/${adId}/insights`, {
        params
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching ad insights:', error);
      throw error;
    }
  }

  /**
   * Validate access token
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.api.get('/me', {
        params: {
          fields: 'id,name'
        }
      });
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  /**
   * Get user info
   */
  async getUserInfo(): Promise<any> {
    try {
      const response = await this.api.get('/me', {
        params: {
          fields: 'id,name,email,picture'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }

  /**
   * Helper function to get last 7 days date range
   */
  static getLast7DaysRange(): DateRange {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);

    return {
      since: lastWeek.toISOString().split('T')[0],
      until: today.toISOString().split('T')[0]
    };
  }

  /**
   * Helper function to get last 30 days date range
   */
  static getLast30DaysRange(): DateRange {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setDate(today.getDate() - 30);

    return {
      since: lastMonth.toISOString().split('T')[0],
      until: today.toISOString().split('T')[0]
    };
  }
}