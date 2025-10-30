'use client';

import { useState, useEffect } from 'react';

// 날짜 범위 타입
export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

// 타입 정의
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
  optimization_goal: string;
  billing_event: string;
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
    image_url?: string;
    video_url?: string;
    call_to_action_type: string;
  };
  created_time: string;
}

export interface AdInsights {
  impressions: number;
  reach: number;
  frequency: number;
  spend: number;
  clicks: number;
  cpm: number;
  cpc: number;
  ctr: number;
  conversions: number;
  cost_per_conversion: number;
}

export interface SummaryData {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCTR: number;
  averageCPM: number;
  averageCPC: number;
}

export interface DailyInsight {
  date_start: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
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

// 날짜 범위를 API 형식으로 변환하는 헬퍼 함수
const formatDateRange = (dateRange: DateRange): string => {
  if (!dateRange.startDate || !dateRange.endDate) {
    // 기본값: 최근 7일
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    return `${startDate.toISOString().split('T')[0]},${endDate.toISOString().split('T')[0]}`;
  }

  const startDateStr = dateRange.startDate.toISOString().split('T')[0];
  const endDateStr = dateRange.endDate.toISOString().split('T')[0];
  return `${startDateStr},${endDateStr}`;
};

export function useMetaData() {
  // 인증 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  // 로딩 및 에러 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // 데이터 상태
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [dailyInsights, setDailyInsights] = useState<DailyInsight[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: (() => {
      const date = new Date();
      date.setDate(date.getDate() - 6); // 7일 전부터
      return date;
    })(),
    endDate: new Date() // 오늘까지
  });

  // 광고세트 및 광고 데이터
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [adSetInsights, setAdSetInsights] = useState<{[key: string]: AdInsights}>({});
  const [adInsights, setAdInsights] = useState<{[key: string]: AdInsights}>({});

  // 전체 데이터 저장용 (덮어쓰기 방지)
  const [allLoadedAds, setAllLoadedAds] = useState<Ad[]>([]);
  const [allLoadedAdSets, setAllLoadedAdSets] = useState<AdSet[]>([]);
  const [allLoadedAdInsights, setAllLoadedAdInsights] = useState<{[key: string]: AdInsights}>({});

  // 초기 인증 확인
  useEffect(() => {
    const token = localStorage.getItem('facebook_access_token');
    const userInfo = localStorage.getItem('user_info');
    const accounts = localStorage.getItem('ad_accounts');

    if (token && userInfo && accounts) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userInfo));
      const parsedAccounts = JSON.parse(accounts);
      setAdAccounts(parsedAccounts);

      if (parsedAccounts.length > 0) {
        setSelectedAccount(parsedAccounts[0].account_id);
      }
    }

    setInitialLoading(false);
  }, []);

  // 계정 데이터 로딩
  useEffect(() => {
    if (selectedAccount && isAuthenticated) {
      fetchAccountData(selectedAccount);
    }
  }, [selectedAccount, isAuthenticated, dateRange]);

  const fetchAccountData = async (accountId: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('facebook_access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // 날짜 범위를 API 형식으로 변환
      const dateRangeParam = formatDateRange(dateRange);

      // Fetch campaigns, summary, and daily insights in parallel
      const [campaignResponse, summaryResponse, dailyResponse] = await Promise.all([
        fetch(`http://localhost:3003/api/ads/accounts/${accountId}/campaigns?date_range=${dateRangeParam}`, { headers }),
        fetch(`http://localhost:3003/api/ads/accounts/${accountId}/summary?date_range=${dateRangeParam}`, { headers }),
        fetch(`http://localhost:3003/api/ads/accounts/${accountId}/insights/daily?date_range=${dateRangeParam}`, { headers })
      ]);

      if (!campaignResponse.ok) {
        const errorData = await campaignResponse.json();
        throw new Error(errorData.error || 'Failed to fetch campaigns');
      }

      if (!summaryResponse.ok) {
        const errorData = await summaryResponse.json();
        throw new Error(errorData.error || 'Failed to fetch summary');
      }

      const campaignData = await campaignResponse.json();
      const summaryDataResponse = await summaryResponse.json();
      const dailyDataResponse = await dailyResponse.json();

      setCampaigns(campaignData.data || []);
      setSummaryData(summaryDataResponse.data || null);
      setDailyInsights(dailyDataResponse.data || []);

      // 모든 캠페인의 광고세트와 광고 데이터를 미리 로드
      const allAdSets: AdSet[] = [];
      const allAds: Ad[] = [];
      const allAdSetInsights: {[key: string]: AdInsights} = {};
      const allAdInsights: {[key: string]: AdInsights} = {};

      for (const campaign of campaignData.data || []) {
        try {
          // 캠페인별 광고세트 가져오기
          const adSetsResponse = await fetch(`http://localhost:3003/api/ads/campaigns/${campaign.id}/adsets`, { headers });
          if (adSetsResponse.ok) {
            const adSetsData = await adSetsResponse.json();
            const campaignAdSets = adSetsData.data || [];
            allAdSets.push(...campaignAdSets);

            // 광고세트별 인사이트 가져오기
            for (const adSet of campaignAdSets) {
              try {
                const adSetInsightsResponse = await fetch(
                  `http://localhost:3003/api/ads/adsets/${adSet.id}/insights?date_range=${dateRange}`,
                  { headers }
                );
                if (adSetInsightsResponse.ok) {
                  const adSetInsightsData = await adSetInsightsResponse.json();
                  allAdSetInsights[adSet.id] = adSetInsightsData.data;
                }

                // 광고세트별 광고 가져오기
                const adsResponse = await fetch(`http://localhost:3003/api/ads/adsets/${adSet.id}/ads`, { headers });
                if (adsResponse.ok) {
                  const adsData = await adsResponse.json();
                  const adSetAds = adsData.data || [];
                  allAds.push(...adSetAds);

                  // 개별 광고별 인사이트 가져오기
                  for (const ad of adSetAds) {
                    try {
                      const adInsightsResponse = await fetch(
                        `http://localhost:3003/api/ads/ads/${ad.id}/insights?date_range=${dateRange}`,
                        { headers }
                      );
                      if (adInsightsResponse.ok) {
                        const adInsightsData = await adInsightsResponse.json();
                        allAdInsights[ad.id] = adInsightsData.data;
                      }
                    } catch (adInsightsError) {
                      console.error(`Error fetching insights for ad ${ad.id}:`, adInsightsError);
                    }
                  }
                }
              } catch (adSetError) {
                console.error(`Error fetching data for ad set ${adSet.id}:`, adSetError);
              }
            }
          }
        } catch (campaignError) {
          console.error(`Error fetching data for campaign ${campaign.id}:`, campaignError);
        }
      }

      setAdSets(allAdSets);
      setAds(allAds);
      setAdSetInsights(allAdSetInsights);
      setAdInsights(allAdInsights);

      // 전체 데이터도 별도로 저장 (덮어쓰기 방지)
      setAllLoadedAds(allAds);
      setAllLoadedAdSets(allAdSets);
      setAllLoadedAdInsights(allAdInsights);

    } catch (error) {
      console.error('Error fetching account data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (userData: User, accounts: AdAccount[], accessToken: string) => {
    setIsAuthenticated(true);
    setUser(userData);
    setAdAccounts(accounts);

    if (accounts.length > 0) {
      setSelectedAccount(accounts[0].account_id);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('facebook_access_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('ad_accounts');
    setIsAuthenticated(false);
    setUser(null);
    setAdAccounts([]);
    setSelectedAccount('');
    setCampaigns([]);
    setSummaryData(null);
  };

  const formatCurrency = (amount: number, currency: string = 'KRW') => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'KRW',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  return {
    // 인증 상태
    isAuthenticated,
    user,
    adAccounts,
    selectedAccount,
    setSelectedAccount,

    // 로딩 및 에러
    loading,
    error,
    setError,
    initialLoading,

    // 데이터
    campaigns,
    summaryData,
    dailyInsights,
    dateRange,
    setDateRange,

    // 광고세트 및 광고
    adSets,
    ads,
    adSetInsights,
    adInsights,

    // 전체 데이터
    allLoadedAds,
    allLoadedAdSets,
    allLoadedAdInsights,

    // 함수들
    handleLoginSuccess,
    handleLogout,
    formatCurrency,
    formatNumber,
  };
}