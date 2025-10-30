import express, { Request, Response } from 'express';
import { FacebookAPIService } from '@metaowners/shared/src/services/facebook-api';

const router = express.Router();

/**
 * Get user's ad accounts
 */
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    const facebookAPI = new FacebookAPIService(accessToken);

    // Validate token first
    const isValidToken = await facebookAPI.validateToken();
    if (!isValidToken) {
      return res.status(401).json({
        error: 'Invalid or expired access token'
      });
    }

    try {
      const adAccounts = await facebookAPI.getAdAccounts();
      res.json({
        success: true,
        data: adAccounts,
        count: adAccounts.length
      });
    } catch (adsError: any) {
      // If ads access fails, return sample data for development
      console.warn('Ads API access failed, returning sample data:', adsError.message);

      const sampleAccounts = [
        {
          id: "act_123456789",
          name: "샘플 광고 계정",
          account_id: "123456789",
          currency: "KRW",
          timezone_name: "Asia/Seoul",
          account_status: 1
        },
        {
          id: "act_987654321",
          name: "테스트 계정 2",
          account_id: "987654321",
          currency: "USD",
          timezone_name: "America/Los_Angeles",
          account_status: 1
        }
      ];

      res.json({
        success: true,
        data: sampleAccounts,
        count: sampleAccounts.length,
        note: "Sample data - requires ads_read permission for real data"
      });
    }

  } catch (error: any) {
    console.error('Error in accounts endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch ad accounts',
      details: error.message
    });
  }
});

/**
 * Get campaigns for an ad account
 */
router.get('/accounts/:accountId/campaigns', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { date_range = 'last_7_days' } = req.query;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    const facebookAPI = new FacebookAPIService(accessToken);

    try {
      const campaigns = await facebookAPI.getCampaigns(accountId);
      res.json({
        success: true,
        data: campaigns,
        count: campaigns.length,
        accountId
      });
    } catch (campaignError: any) {
      console.warn('Could not fetch campaigns, using sample data:', campaignError.message);

      // Return sample campaigns for development
      const sampleCampaigns = [
        {
          id: "120330000123456789",
          name: "여름 세일 캠페인",
          objective: "전환",
          status: "ACTIVE",
          daily_budget: "50000",
          created_time: "2025-10-01T10:00:00+0900"
        },
        {
          id: "120330000987654321",
          name: "브랜드 인지도 캠페인",
          objective: "REACH",
          status: "ACTIVE",
          lifetime_budget: "1000000",
          created_time: "2025-10-15T14:30:00+0900"
        },
        {
          id: "120330000555666777",
          name: "신제품 런칭 캠페인",
          objective: "트래픽",
          status: "PAUSED",
          daily_budget: "30000",
          created_time: "2025-10-20T09:15:00+0900"
        }
      ];

      res.json({
        success: true,
        data: sampleCampaigns,
        count: sampleCampaigns.length,
        accountId,
        note: "Sample data - requires ads_read permission for real campaigns"
      });
    }

  } catch (error: any) {
    console.error('Error in campaigns endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch campaigns',
      details: error.message
    });
  }
});

/**
 * Get insights for an ad account
 */
router.get('/accounts/:accountId/insights', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    // Parse query parameters
    const {
      level = 'campaign',
      date_range = 'last_7_days',
      fields,
      breakdowns
    } = req.query;

    const facebookAPI = new FacebookAPIService(accessToken);

    // Determine time range
    let timeRange;
    switch (date_range) {
      case 'last_7_days':
        timeRange = FacebookAPIService.getLast7DaysRange();
        break;
      case 'last_30_days':
        timeRange = FacebookAPIService.getLast30DaysRange();
        break;
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        timeRange = { since: today, until: today };
        break;
      default:
        timeRange = FacebookAPIService.getLast7DaysRange();
    }

    const insights = await facebookAPI.getCampaignInsights(accountId, {
      level: level as any,
      time_range: timeRange,
      fields: fields ? (fields as string).split(',') : undefined,
      breakdowns: breakdowns ? (breakdowns as string).split(',') : undefined
    });

    res.json({
      success: true,
      data: insights.data || [],
      accountId,
      dateRange: timeRange,
      paging: insights.paging
    });

  } catch (error: any) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      error: 'Failed to fetch insights',
      details: error.message
    });
  }
});

/**
 * Get ad sets for a specific campaign
 */
router.get('/campaigns/:campaignId/adsets', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    const facebookAPI = new FacebookAPIService(accessToken);

    try {
      const adSets = await facebookAPI.getAdSets(campaignId);
      res.json({
        success: true,
        data: adSets,
        count: adSets.length,
        campaignId
      });
    } catch (adSetsError: any) {
      console.warn('Could not fetch ad sets, using sample data:', adSetsError.message);

      // Return sample ad sets for development - generate unique ad sets per campaign
      const baseId = parseInt(campaignId.slice(-9)); // Use last 9 digits of campaignId for uniqueness
      const sampleAdSets = [
        {
          id: `12033000${baseId}1`,
          name: "타겟 오디언스 A - 관심사 기반",
          campaign_id: campaignId,
          status: "ACTIVE",
          daily_budget: "20000",
          optimization_goal: "링크클릭",
          billing_event: "링크클릭",
          targeting: {
            age_min: 25,
            age_max: 45,
            genders: [1, 2],
            geo_locations: { countries: ["KR"] }
          },
          created_time: "2025-10-15T09:00:00+0900"
        },
        {
          id: `12033000${baseId}2`,
          name: "타겟 오디언스 B - 행동 기반",
          campaign_id: campaignId,
          status: "ACTIVE",
          daily_budget: "15000",
          optimization_goal: "전환",
          billing_event: "노출",
          targeting: {
            age_min: 30,
            age_max: 50,
            genders: [1, 2],
            geo_locations: { countries: ["KR"] }
          },
          created_time: "2025-10-20T14:30:00+0900"
        },
        {
          id: `12033000${baseId}3`,
          name: "리타겟팅 오디언스",
          campaign_id: campaignId,
          status: "PAUSED",
          daily_budget: "10000",
          optimization_goal: "전환",
          billing_event: "노출",
          targeting: {
            age_min: 18,
            age_max: 65,
            genders: [1, 2],
            geo_locations: { countries: ["KR"] }
          },
          created_time: "2025-10-25T11:15:00+0900"
        }
      ];

      res.json({
        success: true,
        data: sampleAdSets,
        count: sampleAdSets.length,
        campaignId,
        note: "Sample data - requires ads_read permission for real ad sets"
      });
    }

  } catch (error: any) {
    console.error('Error in ad sets endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch ad sets',
      details: error.message
    });
  }
});

/**
 * Get ads for a specific ad set
 */
router.get('/adsets/:adSetId/ads', async (req: Request, res: Response) => {
  try {
    const { adSetId } = req.params;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    const facebookAPI = new FacebookAPIService(accessToken);

    try {
      const ads = await facebookAPI.getAds(adSetId);
      res.json({
        success: true,
        data: ads,
        count: ads.length,
        adSetId
      });
    } catch (adsError: any) {
      console.warn('Could not fetch ads, using sample data:', adsError.message);

      // Return sample ads for development - generate unique ads per ad set
      const baseId = parseInt(adSetId.slice(-9)); // Use last 9 digits of adSetId for uniqueness
      const sampleAds = [
        {
          id: `12033000${baseId}01`,
          name: "크리에이티브 A - 이미지 광고",
          adset_id: adSetId,
          status: "ACTIVE",
          creative: {
            title: "특별 할인 혜택!",
            body: "지금 가입하면 30% 할인! 놓치지 마세요.",
            image_url: "https://example.com/image1.jpg",
            call_to_action_type: "자세히 보기"
          },
          created_time: "2025-10-15T10:00:00+0900"
        },
        {
          id: `12033000${baseId}02`,
          name: "크리에이티브 B - 비디오 광고",
          adset_id: adSetId,
          status: "ACTIVE",
          creative: {
            title: "새로운 제품 소개",
            body: "혁신적인 기능으로 일상을 바꿔보세요.",
            video_url: "https://example.com/video1.mp4",
            call_to_action_type: "지금 구매"
          },
          created_time: "2025-10-18T16:20:00+0900"
        },
        {
          id: `12033000${baseId}03`,
          name: "크리에이티브 C - 캐러셀 광고",
          adset_id: adSetId,
          status: "PAUSED",
          creative: {
            title: "다양한 제품 둘러보기",
            body: "여러 제품을 한번에 확인하세요.",
            call_to_action_type: "제품 보기"
          },
          created_time: "2025-10-22T13:45:00+0900"
        }
      ];

      res.json({
        success: true,
        data: sampleAds,
        count: sampleAds.length,
        adSetId,
        note: "Sample data - requires ads_read permission for real ads"
      });
    }

  } catch (error: any) {
    console.error('Error in ads endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch ads',
      details: error.message
    });
  }
});

/**
 * Get insights for ad sets
 */
router.get('/adsets/:adSetId/insights', async (req: Request, res: Response) => {
  try {
    const { adSetId } = req.params;
    const { date_range = 'last_7_days' } = req.query;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    // 날짜 범위에 따른 샘플 인사이트 생성
    const generateAdSetInsights = (range: string, adSetId: string) => {
      // 광고세트 ID를 기반으로 시드 생성 (일관된 데이터를 위해)
      const adSetSeed = parseInt(adSetId.slice(-4)) || 2000;

      // 날짜 범위에 따른 멀티플라이어 계산
      let dayMultiplier = 1;
      if (range.includes(',')) {
        // 커스텀 날짜 범위 처리 (YYYY-MM-DD,YYYY-MM-DD 형식)
        const [startDateStr, endDateStr] = range.split(',');
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        dayMultiplier = daysDiff / 7; // 7일 기준으로 정규화
      } else {
        // 기존 프리셋 범위 처리
        switch (range) {
          case 'today': dayMultiplier = 1/7; break;
          case 'yesterday': dayMultiplier = 1/7; break;
          case 'last_7_days': dayMultiplier = 1; break;
          case 'last_30_days': dayMultiplier = 30/7; break;
          case 'last_90_days': dayMultiplier = 90/7; break;
          default: dayMultiplier = 1;
        }
      }

      // 시드를 기반으로 한 일관된 랜덤 값 생성
      const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };

      const baseImpressions = Math.round((15000 + seededRandom(adSetSeed * 1) * 10000) * dayMultiplier);
      const baseReach = Math.round((8000 + seededRandom(adSetSeed * 2) * 5000) * dayMultiplier);
      const baseClicks = Math.round((400 + seededRandom(adSetSeed * 3) * 300) * dayMultiplier);
      const baseSpend = Math.round((25000 + seededRandom(adSetSeed * 4) * 15000) * dayMultiplier);
      const baseConversions = Math.round((15 + seededRandom(adSetSeed * 5) * 10) * dayMultiplier);

      return {
        impressions: Math.max(baseImpressions, 1),
        reach: Math.max(baseReach, 1),
        clicks: Math.max(baseClicks, 0),
        spend: Math.max(baseSpend, 0),
        conversions: Math.max(baseConversions, 0),
        ctr: Number(((baseClicks / baseImpressions) * 100).toFixed(2)),
        cpc: baseClicks > 0 ? Math.round(baseSpend / baseClicks) : 0,
        cpm: Math.round((baseSpend / baseImpressions) * 1000)
      };
    };

    const sampleInsights = generateAdSetInsights(date_range as string, adSetId);

    res.json({
      success: true,
      data: sampleInsights,
      adSetId,
      dateRange: date_range,
      note: "Sample data - requires ads_read permission for real insights"
    });

  } catch (error: any) {
    console.error('Error fetching ad set insights:', error);
    res.status(500).json({
      error: 'Failed to fetch ad set insights',
      details: error.message
    });
  }
});

/**
 * Get insights for individual ads
 */
router.get('/ads/:adId/insights', async (req: Request, res: Response) => {
  try {
    const { adId } = req.params;
    const { date_range = 'last_7_days' } = req.query;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    // 날짜 범위에 따른 샘플 인사이트 생성
    const generateAdInsights = (range: string, adId: string) => {
      // 광고 ID를 기반으로 시드 생성 (일관된 데이터를 위해)
      const adSeed = parseInt(adId.slice(-4)) || 1000;

      // 날짜 범위에 따른 멀티플라이어 계산
      let dayMultiplier = 1;
      if (range.includes(',')) {
        // 커스텀 날짜 범위 처리 (YYYY-MM-DD,YYYY-MM-DD 형식)
        const [startDateStr, endDateStr] = range.split(',');
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        dayMultiplier = daysDiff / 7; // 7일 기준으로 정규화
      } else {
        // 기존 프리셋 범위 처리
        switch (range) {
          case 'today': dayMultiplier = 1/7; break;
          case 'yesterday': dayMultiplier = 1/7; break;
          case 'last_7_days': dayMultiplier = 1; break;
          case 'last_30_days': dayMultiplier = 30/7; break;
          case 'last_90_days': dayMultiplier = 90/7; break;
          default: dayMultiplier = 1;
        }
      }

      // 시드를 기반으로 한 일관된 랜덤 값 생성
      const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };

      const baseImpressions = Math.round((5000 + seededRandom(adSeed * 1) * 8000) * dayMultiplier);
      const baseReach = Math.round((3000 + seededRandom(adSeed * 2) * 4000) * dayMultiplier);
      const baseClicks = Math.round((120 + seededRandom(adSeed * 3) * 200) * dayMultiplier);
      const baseSpend = Math.round((8000 + seededRandom(adSeed * 4) * 12000) * dayMultiplier);
      const baseConversions = Math.round((5 + seededRandom(adSeed * 5) * 8) * dayMultiplier);

      return {
        impressions: Math.max(baseImpressions, 1),
        reach: Math.max(baseReach, 1),
        clicks: Math.max(baseClicks, 0),
        spend: Math.max(baseSpend, 0),
        conversions: Math.max(baseConversions, 0),
        ctr: Number(((baseClicks / baseImpressions) * 100).toFixed(2)),
        cpc: baseClicks > 0 ? Math.round(baseSpend / baseClicks) : 0,
        cpm: Math.round((baseSpend / baseImpressions) * 1000)
      };
    };

    const sampleInsights = generateAdInsights(date_range as string, adId);

    res.json({
      success: true,
      data: sampleInsights,
      adId,
      dateRange: date_range,
      note: "Sample data - requires ads_read permission for real insights"
    });

  } catch (error: any) {
    console.error('Error fetching ad insights:', error);
    res.status(500).json({
      error: 'Failed to fetch ad insights',
      details: error.message
    });
  }
});

/**
 * Get insights for a specific campaign
 */
router.get('/campaigns/:campaignId/insights', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    const { date_range = 'last_7_days' } = req.query;

    const facebookAPI = new FacebookAPIService(accessToken);

    // Determine time range
    let timeRange;
    switch (date_range) {
      case 'last_7_days':
        timeRange = FacebookAPIService.getLast7DaysRange();
        break;
      case 'last_30_days':
        timeRange = FacebookAPIService.getLast30DaysRange();
        break;
      default:
        timeRange = FacebookAPIService.getLast7DaysRange();
    }

    const insights = await facebookAPI.getSpecificCampaignInsights(campaignId, timeRange);

    res.json({
      success: true,
      data: insights.data || [],
      campaignId,
      dateRange: timeRange
    });

  } catch (error: any) {
    console.error('Error fetching campaign insights:', error);
    res.status(500).json({
      error: 'Failed to fetch campaign insights',
      details: error.message
    });
  }
});

/**
 * Get summary statistics for dashboard
 */
router.get('/accounts/:accountId/summary', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { date_range = 'last_7_days' } = req.query;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    const facebookAPI = new FacebookAPIService(accessToken);

    // Get last 7 days insights for summary
    const timeRange = FacebookAPIService.getLast7DaysRange();

    try {
      const insights = await facebookAPI.getCampaignInsights(accountId, {
        level: 'account',
        time_range: timeRange,
        fields: ['impressions', 'reach', 'spend', 'clicks', 'cpm', 'cpc', 'ctr', 'conversions']
      });

      // Calculate summary
      const data = insights.data?.[0];
      if (!data) {
        return res.json({
          success: true,
          data: {
            totalSpend: 0,
            totalImpressions: 0,
            totalClicks: 0,
            averageCTR: 0,
            period: '7 days'
          }
        });
      }

      const summary = {
        totalSpend: parseFloat(data.spend || '0'),
        totalImpressions: parseInt(data.impressions || '0'),
        totalClicks: parseInt(data.clicks || '0'),
        totalReach: parseInt(data.reach || '0'),
        averageCPM: parseFloat(data.cpm || '0'),
        averageCPC: parseFloat(data.cpc || '0'),
        averageCTR: parseFloat(data.ctr || '0'),
        totalConversions: parseInt(data.conversions?.[0]?.value || '0'),
        period: '7 days',
        dateRange: timeRange
      };

      res.json({
        success: true,
        data: summary
      });

    } catch (summaryError: any) {
      console.warn('Could not fetch summary, using sample data:', summaryError.message);

      // Return realistic sample summary data based on selected date range
      const getDateRangeMultiplier = (range: string) => {
        // 커스텀 날짜 범위 처리 (YYYY-MM-DD,YYYY-MM-DD 형식)
        if (range.includes(',')) {
          const [startDateStr, endDateStr] = range.split(',');
          const startDate = new Date(startDateStr);
          const endDate = new Date(endDateStr);
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1은 시작일도 포함
          return diffDays / 7; // 7일 기준으로 비율 계산
        }

        switch (range) {
          case 'today': return 0.14; // 1/7일
          case 'yesterday': return 0.14;
          case 'last_3_days': return 0.43; // 3/7일
          case 'last_7_days': return 1;
          case 'last_14_days': return 2;
          case 'last_30_days': return 4.3;
          case 'this_month': return 4.3;
          case 'last_month': return 4.3;
          default: return 1;
        }
      };

      const getDateRangeLabel = (range: string) => {
        // 커스텀 날짜 범위 처리
        if (range.includes(',')) {
          const [startDateStr, endDateStr] = range.split(',');
          const startDate = new Date(startDateStr);
          const endDate = new Date(endDateStr);
          return `${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')}`;
        }

        switch (range) {
          case 'today': return '오늘';
          case 'yesterday': return '어제';
          case 'last_3_days': return '최근 3일';
          case 'last_7_days': return '최근 7일';
          case 'last_14_days': return '최근 14일';
          case 'last_30_days': return '최근 30일';
          case 'this_month': return '이번 달';
          case 'last_month': return '지난 달';
          default: return '최근 7일';
        }
      };

      const multiplier = getDateRangeMultiplier(date_range as string);
      const sampleSummary = {
        totalSpend: Math.round(450000 * multiplier),
        totalImpressions: Math.round(125000 * multiplier),
        totalClicks: Math.round(3250 * multiplier),
        totalReach: Math.round(85000 * multiplier),
        averageCTR: 2.6, // 비율은 기간과 무관
        averageCPM: 3600,
        averageCPC: 138,
        totalConversions: Math.round(45 * multiplier),
        period: getDateRangeLabel(date_range as string)
      };

      res.json({
        success: true,
        data: sampleSummary,
        note: "Sample data - requires ads_read permission for real metrics"
      });
    }

  } catch (error: any) {
    console.error('Error in summary endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch summary',
      details: error.message
    });
  }
});

/**
 * Get daily breakdown for detailed analysis
 */
router.get('/accounts/:accountId/insights/daily', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { date_range = 'last_7_days' } = req.query;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    const facebookAPI = new FacebookAPIService(accessToken);

    try {
      // 실제 API 호출 시도
      const insights = await facebookAPI.getCampaignInsights(accountId, {
        level: 'account',
        time_increment: 1, // 일별 데이터
        fields: ['impressions', 'reach', 'spend', 'clicks', 'cpm', 'cpc', 'ctr', 'conversions']
      });

      res.json({
        success: true,
        data: insights.data || []
      });

    } catch (insightsError: any) {
      console.warn('Could not fetch daily insights, using sample data:', insightsError.message);

      // 선택된 기간에 따른 일별 샘플 데이터 생성
      const generateDailyData = (range: string) => {
        let startDate: Date;
        let endDate: Date;

        // 커스텀 날짜 범위 처리 (YYYY-MM-DD,YYYY-MM-DD 형식)
        if (range.includes(',')) {
          const [startDateStr, endDateStr] = range.split(',');
          startDate = new Date(startDateStr);
          endDate = new Date(endDateStr);
        } else {
          // 기존 프리셋 범위 처리
          const getDaysCount = (range: string) => {
            switch (range) {
              case 'today': return 1;
              case 'yesterday': return 1;
              case 'last_3_days': return 3;
              case 'last_7_days': return 7;
              case 'last_14_days': return 14;
              case 'last_30_days': return 30;
              default: return 7;
            }
          };

          const days = getDaysCount(range);
          endDate = new Date();
          startDate = new Date();
          startDate.setDate(startDate.getDate() - days + 1);

          // 특별 케이스 처리
          if (range === 'yesterday') {
            endDate.setDate(endDate.getDate() - 1);
            startDate.setDate(startDate.getDate() - 1);
          }
        }

        const dailyData = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          const date = new Date(currentDate);

          // 요일별로 다른 성과 (주말은 낮게)
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const multiplier = isWeekend ? 0.7 : 1;

          // 랜덤 변동 추가 (±20%)
          const randomFactor = 0.8 + Math.random() * 0.4;

          dailyData.push({
            date_start: date.toISOString().split('T')[0],
            date_stop: date.toISOString().split('T')[0],
            impressions: Math.round(18000 * multiplier * randomFactor),
            reach: Math.round(12000 * multiplier * randomFactor),
            spend: Math.round(64000 * multiplier * randomFactor),
            clicks: Math.round(460 * multiplier * randomFactor),
            cpm: Math.round(3600 * (1 + (Math.random() - 0.5) * 0.3)),
            cpc: Math.round(138 * (1 + (Math.random() - 0.5) * 0.3)),
            ctr: Number((2.6 * (1 + (Math.random() - 0.5) * 0.4)).toFixed(2)),
            conversions: Math.round(6 * multiplier * randomFactor)
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }

        return dailyData;
      };

      const dailyInsights = generateDailyData(date_range as string);

      res.json({
        success: true,
        data: dailyInsights,
        note: "Sample daily data - requires ads_read permission for real insights"
      });
    }

  } catch (error: any) {
    console.error('Error in daily insights endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch daily insights',
      details: error.message
    });
  }
});

export default router;