'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  Target,
  TrendingUp,
  Calendar,
  Eye,
  MousePointer,
  DollarSign,
  Users,
  Activity,
  Settings,
  ChevronRight,
  Palette,
  PlayCircle,
  PauseCircle,
  Download
} from 'lucide-react';
import FacebookLogin from './FacebookLogin';

interface User {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

interface AdAccount {
  id: string;
  name: string;
  account_id: string;
  currency: string;
  account_status: string;
}

interface Campaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

interface AdSet {
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
    geo_locations: { countries: string[] };
  };
}

interface Ad {
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
}

interface AdInsights {
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

interface SummaryData {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalReach: number;
  average클릭률: number;
  averageCPM: number;
  averageCPC: number;
  period: string;
}

export default function RealDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [dailyInsights, setDailyInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string>('last_7_days');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'analysis'>('dashboard');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedAdSet, setSelectedAdSet] = useState<AdSet | null>(null);
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [adSetInsights, setAdSetInsights] = useState<{[key: string]: AdInsights}>({});
  const [adInsights, setAdInsights] = useState<{[key: string]: AdInsights}>({});

  // 전체 데이터 저장용 (덮어쓰기 방지)
  const [allLoadedAds, setAllLoadedAds] = useState<Ad[]>([]);
  const [allLoadedAdSets, setAllLoadedAdSets] = useState<AdSet[]>([]);
  const [allLoadedAdInsights, setAllLoadedAdInsights] = useState<{[key: string]: AdInsights}>({});
  const [campaignView, setCampaignView] = useState<'list' | 'adsets' | 'ads'>('list');

  // 엑셀 다운로드 함수
  const downloadExcel = (data: any[], filename: string, sheetName: string) => {
    // 워크북 생성
    const workbook = XLSX.utils.book_new();

    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 컬럼 너비 자동 조정
    const colWidths = Object.keys(data[0] || {}).map(key => {
      const maxLength = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) }; // 최대 50자로 제한
    });
    worksheet['!cols'] = colWidths;

    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // 파일 다운로드
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const exportAllData = () => {
    // 개별 광고 중심의 분석 데이터
    const allData: any[] = [];

    console.log('전체 데이터 확인:', {
      campaigns: campaigns.length,
      allLoadedAdSets: allLoadedAdSets.length,
      allLoadedAds: allLoadedAds.length,
      allLoadedAdInsights: Object.keys(allLoadedAdInsights).length
    });

    // 전체 로드된 광고를 기준으로 데이터 생성
    allLoadedAds.forEach(ad => {
      // 해당 광고의 광고세트 찾기 (ID로 정확히 매칭)
      const adSet = allLoadedAdSets.find(as => as.id === ad.adset_id);
      // 해당 광고세트의 캠페인 찾기 (ID로 정확히 매칭)
      const campaign = adSet ? campaigns.find(c => c.id === adSet.campaign_id) : null;
      // 광고 성과 데이터
      const insights = allLoadedAdInsights[ad.id];
      // 광고세트 성과 데이터
      const adSetInsightsData = adSet ? adSetInsights[adSet.id] : null;

      console.log('광고 처리:', {
        adName: ad.name,
        adId: ad.id,
        adSetId: ad.adset_id,
        adSetName: adSet?.name,
        campaignId: adSet?.campaign_id,
        campaignName: campaign?.name
      });

      allData.push({
        // 캠페인 정보
        '캠페인명': campaign ? campaign.name : '-',
        '캠페인일예산': campaign && campaign.daily_budget ? `${parseInt(campaign.daily_budget).toLocaleString()}원` : '-',
        '캠페인상태': campaign ? (campaign.status === 'ACTIVE' ? '활성' : '일시정지') : '-',

        // 광고세트 정보
        '광고세트명': adSet ? adSet.name : '-',
        '광고세트일예산': adSet ? `${parseInt(adSet.daily_budget).toLocaleString()}원` : '-',
        '광고세트타겟연령': adSet ? `${adSet.targeting.age_min}-${adSet.targeting.age_max}세` : '-',

        // 개별 광고 정보
        '광고명': ad.name,
        '광고제목': ad.creative.title,
        '광고설명': ad.creative.body,
        '광고상태': ad.status === 'ACTIVE' ? '활성' : '일시정지',

        // 광고 성과 데이터
        '지출': insights ? `${insights.spend.toLocaleString()}원` : '-',
        '노출': insights ? insights.impressions.toLocaleString() : '-',
        '클릭': insights ? insights.clicks.toLocaleString() : '-',
        '클릭률': insights ? `${insights.ctr}%` : '-',
        '클릭당비용': insights ? `${insights.cpc.toLocaleString()}원` : '-',
        '1000노출당비용': insights ? `${insights.cpm.toLocaleString()}원` : '-',
        '도달': insights ? insights.reach.toLocaleString() : '-',
        '전환': insights ? insights.conversions.toString() : '-',
        '잠재고객수': insights ? insights.conversions.toString() : '-',
        '잠재고객당비용': insights && insights.conversions > 0 ? `${(insights.spend / insights.conversions).toLocaleString()}원` : '-'
      });
    });

    const today = new Date().toISOString().split('T')[0];
    downloadExcel(allData, `메타광고_개별분석데이터_${today}`, '개별광고분석');
  };
  const [analysisLevel, setAnalysisLevel] = useState<'account' | 'campaign' | 'adset' | 'ad'>('account');
  const [selectedAnalysisCampaign, setSelectedAnalysisCampaign] = useState<Campaign | null>(null);
  const [selectedAnalysisAdSet, setSelectedAnalysisAdSet] = useState<AdSet | null>(null);
  const [selectedAnalysisAd, setSelectedAnalysisAd] = useState<Ad | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('facebook_access_token');
    const userInfo = localStorage.getItem('user_info');
    const accounts = localStorage.getItem('ad_accounts');

    if (token && userInfo && accounts) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userInfo));
      const parsedAccounts = JSON.parse(accounts);
      setAdAccounts(parsedAccounts);

      // Auto-select first account
      if (parsedAccounts.length > 0) {
        setSelectedAccount(parsedAccounts[0].account_id);
      }
    }
  }, []);

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

      // Fetch campaigns, summary, and daily insights in parallel
      const [campaignResponse, summaryResponse, dailyResponse] = await Promise.all([
        fetch(`http://localhost:3003/api/ads/accounts/${accountId}/campaigns?date_range=${dateRange}`, { headers }),
        fetch(`http://localhost:3003/api/ads/accounts/${accountId}/summary?date_range=${dateRange}`, { headers }),
        fetch(`http://localhost:3003/api/ads/accounts/${accountId}/insights/daily?date_range=${dateRange}`, { headers })
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
        console.log(`캠페인 ${campaign.name} (ID: ${campaign.id}) 처리 시작`);
        try {
          // 캠페인별 광고세트 가져오기
          const adSetsResponse = await fetch(`http://localhost:3003/api/ads/campaigns/${campaign.id}/adsets`, { headers });
          if (adSetsResponse.ok) {
            const adSetsData = await adSetsResponse.json();
            const campaignAdSets = adSetsData.data || [];
            console.log(`캠페인 ${campaign.name}의 광고세트 ${campaignAdSets.length}개 발견`);
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
                  console.log(`광고세트 ${adSet.name}의 광고 ${adSetAds.length}개 발견`);
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
                    } catch (error) {
                      console.warn(`Failed to fetch insights for ad ${ad.id}:`, error);
                    }
                  }
                }
              } catch (error) {
                console.warn(`Failed to fetch data for adset ${adSet.id}:`, error);
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch adsets for campaign ${campaign.id}:`, error);
        }
      }

      // 모든 데이터를 상태에 저장
      console.log('로드된 전체 데이터:', {
        campaigns: campaignData.data?.length || 0,
        allAdSets: allAdSets.length,
        allAds: allAds.length,
        adSetInsights: Object.keys(allAdSetInsights).length,
        adInsights: Object.keys(allAdInsights).length
      });

      setAdSets(allAdSets);
      setAds(allAds);
      setAdSetInsights(allAdSetInsights);
      setAdInsights(allAdInsights);

      // 전체 데이터도 별도로 저장 (덮어쓰기 방지)
      setAllLoadedAds(allAds);
      setAllLoadedAdSets(allAdSets);
      setAllLoadedAdInsights(allAdInsights);

      console.log('상태 업데이트 완료');

    } catch (error) {
      console.error('Error fetching account data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdSets = async (campaignId: string) => {
    // 특정 캠페인의 광고세트만 가져오는 함수 (UI 표시용)
    // 전체 데이터는 이미 fetchAccountData에서 로드됨
    setLoading(true);
    try {
      // 이미 로드된 전체 광고세트에서 해당 캠페인 것만 필터링
      const campaignAdSets = adSets.filter(adSet => adSet.campaign_id === campaignId);

      // UI에서 사용할 현재 선택된 캠페인의 광고세트만 별도로 관리
      // 전체 adSets 상태는 건드리지 않음

    } catch (error) {
      console.error('Error fetching ad sets:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch ad sets');
    } finally {
      setLoading(false);
    }
  };

  const fetchAds = async (adSetId: string) => {
    // 특정 광고세트의 광고만 가져오는 함수 (UI 표시용)
    // 전체 데이터는 이미 fetchAccountData에서 로드됨
    setLoading(true);
    try {
      // 이미 로드된 전체 광고에서 해당 광고세트 것만 필터링
      const adSetAds = ads.filter(ad => ad.adset_id === adSetId);

      // UI에서 사용할 현재 선택된 광고세트의 광고만 별도로 관리
      // 전체 ads 상태는 건드리지 않음

    } catch (error) {
      console.error('Error fetching ads:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch ads');
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignSelect = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setSelectedAdSet(null);
    setCampaignView('adsets');
    fetchAdSets(campaign.id);
  };

  const handleAdSetSelect = (adSet: AdSet) => {
    setSelectedAdSet(adSet);
    setCampaignView('ads');
    fetchAds(adSet.id);
  };

  const handleBackToCampaigns = () => {
    setSelectedCampaign(null);
    setSelectedAdSet(null);
    setCampaignView('list');
    setAdSets([]);
    setAds([]);
  };

  const handleBackToAdSets = () => {
    setSelectedAdSet(null);
    setCampaignView('adsets');
    setAds([]);
  };

  // 분석 탭 관련 핸들러들
  const handleAnalysisCampaignSelect = (campaign: Campaign) => {
    setSelectedAnalysisCampaign(campaign);
    setSelectedAnalysisAdSet(null);
    setSelectedAnalysisAd(null);
    setAnalysisLevel('campaign');
    fetchAdSets(campaign.id);
  };

  const handleAnalysisAdSetSelect = (adSet: AdSet) => {
    setSelectedAnalysisAdSet(adSet);
    setSelectedAnalysisAd(null);
    setAnalysisLevel('adset');
    fetchAds(adSet.id);
  };

  const handleAnalysisAdSelect = (ad: Ad) => {
    setSelectedAnalysisAd(ad);
    setAnalysisLevel('ad');
  };

  const handleBackToAccountAnalysis = () => {
    setSelectedAnalysisCampaign(null);
    setSelectedAnalysisAdSet(null);
    setSelectedAnalysisAd(null);
    setAnalysisLevel('account');
  };

  const handleBackToCampaignAnalysis = () => {
    setSelectedAnalysisAdSet(null);
    setSelectedAnalysisAd(null);
    setAnalysisLevel('campaign');
  };

  const handleBackToAdSetAnalysis = () => {
    setSelectedAnalysisAd(null);
    setAnalysisLevel('adset');
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Meta Owners에 오신 것을 환영합니다
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Facebook 광고 계정을 연결하여 실시간 성과를 확인하세요
            </p>
          </div>

          <FacebookLogin
            onLoginSuccess={handleLoginSuccess}
            onLoginError={(error) => setError(error)}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Meta Owners</h2>
          <p className="mt-2 text-gray-600">
            안녕하세요, {user?.name}님! 광고 성과를 확인해보세요.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700"
        >
          로그아웃
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white p-1 rounded-lg shadow-sm border">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <BarChart3 size={16} />
            대시보드
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'campaigns'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Target size={16} />
            캠페인
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'analysis'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <TrendingUp size={16} />
            분석
          </button>
        </div>
      </div>

      {/* 계정 선택 */}
      {adAccounts.length > 1 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            광고 계정 선택
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {adAccounts.map((account) => (
              <option key={account.account_id} value={account.account_id}>
                {account.name} ({account.account_id})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 날짜 범위 선택 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          데이터 조회 기간
        </label>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="today">오늘</option>
          <option value="yesterday">어제</option>
          <option value="last_3_days">최근 3일</option>
          <option value="last_7_days">최근 7일</option>
          <option value="last_14_days">최근 14일</option>
          <option value="last_30_days">최근 30일</option>
          <option value="this_month">이번 달</option>
          <option value="last_month">지난 달</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          기간을 변경하면 자동으로 데이터가 업데이트됩니다.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => selectedAccount && fetchAccountData(selectedAccount)}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      )}

      {!loading && summaryData && (
        <>
          {/* 대시보드 탭 */}
          {activeTab === 'dashboard' && (
            <>
              {/* 메트릭 카드들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">총 지출</p>
                      <p className="text-2xl font-semibold text-gray-900 mt-2">
                        {formatCurrency(summaryData.totalSpend, 'KRW')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">노출량</p>
                      <p className="text-2xl font-semibold text-gray-900 mt-2">
                        {formatNumber(summaryData.totalImpressions)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">클릭수</p>
                      <p className="text-2xl font-semibold text-gray-900 mt-2">
                        {formatNumber(summaryData.totalClicks)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">클릭률</p>
                      <p className="text-2xl font-semibold text-gray-900 mt-2">
                        {summaryData.averageCTR.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 잠재고객 강조 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-blue-50 p-6 rounded-lg shadow-sm border-2 border-blue-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-blue-900">총 잠재고객 수</p>
                      <p className="text-3xl font-bold text-blue-900 mt-2">
                        {formatNumber(summaryData.totalConversions || 0)}명
                      </p>
                      <p className="text-sm text-blue-700 mt-2">
                        광고를 통해 제품/서비스에 관심을 보인 고객
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg shadow-sm border-2 border-green-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-green-900">잠재고객당 비용</p>
                      <p className="text-3xl font-bold text-green-900 mt-2">
                        {formatCurrency((summaryData.totalSpend / (summaryData.totalConversions || 1)), 'KRW')}
                      </p>
                      <p className="text-sm text-green-700 mt-2">
                        잠재고객 1명 획득 비용
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 추가 요약 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 size={20} />
                    성과 요약
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">평균 1000노출당비용:</span>
                      <span className="font-medium">{formatCurrency(summaryData.averageCPM, 'KRW')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">평균 클릭당비용:</span>
                      <span className="font-medium">{formatCurrency(summaryData.averageCPC, 'KRW')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">도달 범위:</span>
                      <span className="font-medium">{formatNumber(summaryData.totalReach)}명</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Target size={20} />
                    캠페인 현황
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">총 캠페인:</span>
                      <span className="font-medium">{campaigns.length}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">활성 캠페인:</span>
                      <span className="font-medium text-green-600">
                        {campaigns.filter(c => c.status === 'ACTIVE').length}개
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">일시정지:</span>
                      <span className="font-medium text-yellow-600">
                        {campaigns.filter(c => c.status === 'PAUSED').length}개
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 기간 정보 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm flex items-center gap-2">
                  <Calendar size={16} />
                  표시된 데이터는 {summaryData.period} 동안의 성과입니다.
                </p>
              </div>
            </>
          )}

          {/* 캠페인 탭 */}
          {activeTab === 'campaigns' && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                {/* 브레드크럼 네비게이션 */}
                <div className="flex items-center space-x-2 mb-6 text-sm">
                  <button
                    onClick={handleBackToCampaigns}
                    className={`flex items-center gap-1 ${campaignView === 'list' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <Target size={14} />
                    캠페인
                  </button>
                  {selectedCampaign && (
                    <>
                      <span className="text-gray-400">/</span>
                      <button
                        onClick={handleBackToAdSets}
                        className={`flex items-center gap-1 ${campaignView === 'adsets' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        <Settings size={14} />
                        {selectedCampaign.name}
                      </button>
                    </>
                  )}
                  {selectedAdSet && (
                    <>
                      <span className="text-gray-400">/</span>
                      <span className="text-blue-600 font-medium flex items-center gap-1">
                        <Palette size={14} />
                        {selectedAdSet.name}
                      </span>
                    </>
                  )}
                </div>

                {/* 캠페인 목록 */}
                {campaignView === 'list' && (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Target size={20} />
                        캠페인 관리 ({campaigns.length}개)
                      </h3>
                      <div className="text-sm text-gray-600">
                        활성: {campaigns.filter(c => c.status === 'ACTIVE').length}개 |
                        일시정지: {campaigns.filter(c => c.status === 'PAUSED').length}개
                      </div>
                    </div>

                    {campaigns.length > 0 ? (
                      <div className="space-y-4">
                        {campaigns.map((campaign) => (
                          <div
                            key={campaign.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleCampaignSelect(campaign)}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900 text-lg">{campaign.name}</h4>
                                <p className="text-sm text-gray-600">캠페인 ID: {campaign.id}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                                  campaign.status === 'ACTIVE'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {campaign.status === 'ACTIVE' ? <PlayCircle size={12} /> : <PauseCircle size={12} />}
                                  {campaign.status === 'ACTIVE' ? '활성' : '일시정지'}
                                </span>
                                <ChevronRight size={16} className="text-gray-400" />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">캠페인 목표</p>
                                <p className="font-medium">{campaign.objective}</p>
                              </div>
                              {campaign.daily_budget && (
                                <div>
                                  <p className="text-sm text-gray-600">일 예산</p>
                                  <p className="font-medium text-blue-600">
                                    {formatCurrency(parseInt(campaign.daily_budget), 'KRW')}
                                  </p>
                                </div>
                              )}
                              {campaign.lifetime_budget && (
                                <div>
                                  <p className="text-sm text-gray-600">총 예산</p>
                                  <p className="font-medium text-green-600">
                                    {formatCurrency(parseInt(campaign.lifetime_budget), 'KRW')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Target size={48} className="text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">활성 캠페인이 없습니다.</p>
                        <p className="text-gray-400 text-sm mt-2">새로운 캠페인을 생성해보세요.</p>
                      </div>
                    )}
                  </>
                )}

                {/* 광고 세트 목록 */}
                {campaignView === 'adsets' && selectedCampaign && (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Settings size={20} />
                        광고 세트 ({adSets.length}개)
                      </h3>
                      <div className="text-sm text-gray-600">
                        활성: {adSets.filter(as => as.status === 'ACTIVE').length}개 |
                        일시정지: {adSets.filter(as => as.status === 'PAUSED').length}개
                      </div>
                    </div>

                    {adSets.length > 0 ? (
                      <div className="space-y-4">
                        {adSets.map((adSet) => {
                          const insights = adSetInsights[adSet.id];
                          return (
                            <div
                              key={adSet.id}
                              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => handleAdSetSelect(adSet)}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold text-gray-900 text-lg">{adSet.name}</h4>
                                  <p className="text-sm text-gray-600">광고 세트 ID: {adSet.id}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                                    adSet.status === 'ACTIVE'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {adSet.status === 'ACTIVE' ? <PlayCircle size={12} /> : <PauseCircle size={12} />}
                                    {adSet.status === 'ACTIVE' ? '활성' : '일시정지'}
                                  </span>
                                  <ChevronRight size={16} className="text-gray-400" />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">최적화 목표</p>
                                  <p className="font-medium">{adSet.optimization_goal}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">일 예산</p>
                                  <p className="font-medium text-blue-600">
                                    {formatCurrency(parseInt(adSet.daily_budget), 'KRW')}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">타겟 연령</p>
                                  <p className="font-medium">{adSet.targeting.age_min}-{adSet.targeting.age_max}세</p>
                                </div>
                                {insights && (
                                  <div>
                                    <p className="text-sm text-gray-600">지출</p>
                                    <p className="font-medium text-green-600">
                                      {formatCurrency(insights.spend, 'KRW')}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {insights && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-600">노출: </span>
                                      <span className="font-medium">{formatNumber(insights.impressions)}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">클릭: </span>
                                      <span className="font-medium">{formatNumber(insights.clicks)}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">클릭률: </span>
                                      <span className="font-medium">{insights.ctr}%</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">전환: </span>
                                      <span className="font-medium">{insights.conversions}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Settings size={48} className="text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">광고 세트가 없습니다.</p>
                        <p className="text-gray-400 text-sm mt-2">캠페인에 광고 세트를 추가해보세요.</p>
                      </div>
                    )}
                  </>
                )}

                {/* 개별 광고 목록 */}
                {campaignView === 'ads' && selectedAdSet && (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Palette size={20} />
                        광고 ({ads.length}개)
                      </h3>
                      <div className="text-sm text-gray-600">
                        활성: {ads.filter(ad => ad.status === 'ACTIVE').length}개 |
                        일시정지: {ads.filter(ad => ad.status === 'PAUSED').length}개
                      </div>
                    </div>

                    {ads.length > 0 ? (
                      <div className="space-y-4">
                        {ads.map((ad) => {
                          const insights = adInsights[ad.id];
                          return (
                            <div key={ad.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold text-gray-900 text-lg">{ad.name}</h4>
                                  <p className="text-sm text-gray-600">광고 ID: {ad.id}</p>
                                </div>
                                <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                                  ad.status === 'ACTIVE'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {ad.status === 'ACTIVE' ? <PlayCircle size={12} /> : <PauseCircle size={12} />}
                                  {ad.status === 'ACTIVE' ? '활성' : '일시정지'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 크리에이티브 정보 */}
                                <div>
                                  <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                    <Palette size={16} />
                                    크리에이티브
                                  </h5>
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-sm text-gray-600">제목</p>
                                      <p className="font-medium">{ad.creative.title}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">설명</p>
                                      <p className="text-sm">{ad.creative.body}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">행동유도</p>
                                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                        {ad.creative.call_to_action_type}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* 성과 지표 */}
                                {insights && (
                                  <div>
                                    <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                      <TrendingUp size={16} />
                                      성과 지표
                                    </h5>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="bg-gray-50 p-3 rounded">
                                        <p className="text-xs text-gray-600">지출</p>
                                        <p className="font-semibold text-green-600">
                                          {formatCurrency(insights.spend, 'KRW')}
                                        </p>
                                      </div>
                                      <div className="bg-gray-50 p-3 rounded">
                                        <p className="text-xs text-gray-600">노출</p>
                                        <p className="font-semibold">{formatNumber(insights.impressions)}</p>
                                      </div>
                                      <div className="bg-gray-50 p-3 rounded">
                                        <p className="text-xs text-gray-600">클릭</p>
                                        <p className="font-semibold">{formatNumber(insights.clicks)}</p>
                                      </div>
                                      <div className="bg-gray-50 p-3 rounded">
                                        <p className="text-xs text-gray-600">클릭률</p>
                                        <p className="font-semibold text-blue-600">{insights.ctr}%</p>
                                      </div>
                                      <div className="bg-gray-50 p-3 rounded">
                                        <p className="text-xs text-gray-600">클릭당비용</p>
                                        <p className="font-semibold">{formatCurrency(insights.cpc, 'KRW')}</p>
                                      </div>
                                      <div className="bg-gray-50 p-3 rounded">
                                        <p className="text-xs text-gray-600">전환</p>
                                        <p className="font-semibold text-purple-600">{insights.conversions}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Palette size={48} className="text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">광고가 없습니다.</p>
                        <p className="text-gray-400 text-sm mt-2">광고 세트에 광고를 추가해보세요.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* 분석 탭 */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp size={20} />
                    성과 분석 대시보드
                  </h3>
                  <button
                    onClick={exportAllData}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Download size={20} />
                    개별 광고 분석 다운로드
                  </button>
                </div>

                {/* 전체 요약 */}
                {dailyInsights.length > 0 ? (
                  <div className="space-y-8">
                    {/* 일별 지출 추이 */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <BarChart3 size={20} className="text-blue-600" />
                        일별 지출 추이
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        {dailyInsights.map((day, index) => {
                          const maxSpend = Math.max(...dailyInsights.map(d => d.spend));
                          const width = (day.spend / maxSpend) * 100;
                          const date = new Date(day.date_start);
                          const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
                          const dayName = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

                          return (
                            <div key={index} className="flex items-center space-x-3">
                              <span className="text-xs text-gray-600 w-16">{dateStr}({dayName})</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                <div
                                  className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                                  style={{ width: `${width}%` }}
                                >
                                  <span className="text-xs text-white font-medium">
                                    {formatCurrency(day.spend, 'KRW')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 캠페인별 성과 테이블 */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Target size={20} className="text-green-600" />
                        캠페인별 성과
                      </h4>
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">캠페인</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">목표</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">일 예산</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">광고세트 수</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {campaigns.map((campaign) => (
                                <tr key={campaign.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <Target size={16} className="text-gray-400 mr-3" />
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                                        <div className="text-sm text-gray-500">ID: {campaign.id}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {campaign.objective}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {campaign.daily_budget ? formatCurrency(parseInt(campaign.daily_budget), 'KRW') : '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                                      campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {campaign.status === 'ACTIVE' ? <PlayCircle size={10} /> : <PauseCircle size={10} />}
                                      {campaign.status === 'ACTIVE' ? '활성' : '일시정지'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {adSets.filter(adSet => adSet.campaign_id === campaign.id).length}개
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                      onClick={() => {
                                        setSelectedCampaign(campaign);
                                        setCampaignView('adsets');
                                        fetchAdSets(campaign.id);
                                      }}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      상세보기
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* 광고세트별 성과 (선택된 캠페인이 있을 때만) */}
                    {selectedCampaign && campaignView === 'adsets' && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                            <Settings size={20} />
                            "{selectedCampaign.name}" 광고세트별 성과
                          </h4>
                          <button
                            onClick={() => {
                              setSelectedCampaign(null);
                              setCampaignView('list');
                            }}
                            className="text-sm text-gray-600 hover:text-gray-900"
                          >
                            목록으로 돌아가기
                          </button>
                        </div>
                        <div className="bg-white border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-blue-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">광고세트</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최적화 목표</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">일 예산</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">타겟 연령</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">지출</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {adSets.filter(adSet => adSet.campaign_id === selectedCampaign.id).map((adSet) => {
                                  const insights = adSetInsights[adSet.id];
                                  return (
                                    <tr key={adSet.id} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <Settings size={16} className="text-gray-400 mr-3" />
                                          <div>
                                            <div className="text-sm font-medium text-gray-900">{adSet.name}</div>
                                            <div className="text-sm text-gray-500">ID: {adSet.id}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {adSet.optimization_goal}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatCurrency(parseInt(adSet.daily_budget), 'KRW')}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {adSet.targeting.age_min}-{adSet.targeting.age_max}세
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                        {insights ? formatCurrency(insights.spend, 'KRW') : '-'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                          onClick={() => {
                                            setSelectedAdSet(adSet);
                                            setCampaignView('ads');
                                            fetchAds(adSet.id);
                                          }}
                                          className="text-indigo-600 hover:text-indigo-900"
                                        >
                                          광고보기
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 개별 광고 성과 (선택된 광고세트가 있을 때만) */}
                    {selectedAdSet && campaignView === 'ads' && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                            <Palette size={20} />
                            "{selectedAdSet.name}" 개별 광고 성과
                          </h4>
                          <button
                            onClick={() => {
                              setSelectedAdSet(null);
                              setCampaignView('adsets');
                            }}
                            className="text-sm text-gray-600 hover:text-gray-900"
                          >
                            광고세트로 돌아가기
                          </button>
                        </div>
                        <div className="bg-white border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-purple-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">광고명</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">크리에이티브</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">행동유도</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">지출</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">노출</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">클릭</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">클릭률</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">잠재고객</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">고객당 비용</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {ads.filter(ad => ad.adset_id === selectedAdSet.id).map((ad) => {
                                  const insights = adInsights[ad.id];
                                  return (
                                    <tr key={ad.id} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <Palette size={16} className="text-purple-600 mr-3" />
                                          <div>
                                            <div className="text-sm font-medium text-gray-900">{ad.name}</div>
                                            <div className="text-sm text-gray-500">ID: {ad.id}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="max-w-xs">
                                          <div className="text-sm font-medium text-gray-900">{ad.creative.title}</div>
                                          <div className="text-sm text-gray-500 truncate">{ad.creative.body}</div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                          {ad.creative.call_to_action_type}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                                          ad.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          {ad.status === 'ACTIVE' ? <PlayCircle size={10} /> : <PauseCircle size={10} />}
                                          {ad.status === 'ACTIVE' ? '활성' : '일시정지'}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                        {insights ? formatCurrency(insights.spend, 'KRW') : '-'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {insights ? formatNumber(insights.impressions) : '-'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {insights ? formatNumber(insights.clicks) : '-'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                        {insights ? `${insights.ctr}%` : '-'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900 bg-blue-50">
                                        {insights ? insights.conversions : '-'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900 bg-blue-50">
                                        {insights && insights.conversions > 0
                                          ? formatCurrency(insights.spend / insights.conversions, 'KRW')
                                          : '-'
                                        }
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">분석할 데이터가 없습니다.</p>
                    <p className="text-gray-400 text-sm mt-2">다른 기간을 선택해보세요.</p>
                  </div>
                )}
              </div>

              {/* 기간 정보 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm flex items-center gap-2">
                  <Calendar size={16} />
                  분석 데이터는 {summaryData?.period} 동안의 성과를 기반으로 합니다.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}