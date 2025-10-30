'use client';

import { useState } from 'react';
import { useMetaData } from '../hooks/useMetaData';
import FacebookLogin from '../components/FacebookLogin';
import CustomSelect from '../components/CustomSelect';
import DateRangePicker from '../components/DateRangePicker';
import { ArrowLeft, Building, Target, Palette } from 'lucide-react';

export default function CampaignsPage() {
  const {
    isAuthenticated,
    loading,
    error,
    campaigns,
    adSets,
    ads,
    adSetInsights,
    adInsights,
    dateRange,
    setDateRange,
    selectedAccount,
    setSelectedAccount,
    adAccounts,
    handleLoginSuccess,
    handleLogout,
    formatCurrency,
    formatNumber,
    setError,
    initialLoading,
  } = useMetaData();

  // 캠페인 뷰 상태
  const [campaignView, setCampaignView] = useState<'list' | 'adsets' | 'ads'>('list');
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [selectedAdSet, setSelectedAdSet] = useState<any>(null);

  const handleCampaignSelect = (campaign: any) => {
    setSelectedCampaign(campaign);
    setSelectedAdSet(null);
    setCampaignView('adsets');
  };

  const handleAdSetSelect = (adSet: any) => {
    setSelectedAdSet(adSet);
    setCampaignView('ads');
  };

  const handleBackToCampaigns = () => {
    setSelectedCampaign(null);
    setSelectedAdSet(null);
    setCampaignView('list');
  };

  const handleBackToAdSets = () => {
    setSelectedAdSet(null);
    setCampaignView('adsets');
  };

  // 날짜 범위를 한국어로 포맷팅하는 함수
  const getDateRangeText = () => {
    if (!dateRange.startDate || !dateRange.endDate) return '최근 7일간';

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric'
      });
    };

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 오늘 하루
    if (dateRange.startDate.toDateString() === dateRange.endDate.toDateString() &&
        dateRange.startDate.toDateString() === today.toDateString()) {
      return '오늘';
    }

    // 어제 하루
    if (dateRange.startDate.toDateString() === dateRange.endDate.toDateString() &&
        dateRange.startDate.toDateString() === yesterday.toDateString()) {
      return '어제';
    }

    // 하루 선택
    if (dateRange.startDate.toDateString() === dateRange.endDate.toDateString()) {
      return `${formatDate(dateRange.startDate)}`;
    }

    // 최근 7일 확인
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    if (dateRange.startDate.toDateString() === sevenDaysAgo.toDateString() &&
        dateRange.endDate.toDateString() === today.toDateString()) {
      return '최근 7일간';
    }

    // 최근 30일 확인
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    if (dateRange.startDate.toDateString() === thirtyDaysAgo.toDateString() &&
        dateRange.endDate.toDateString() === today.toDateString()) {
      return '최근 30일간';
    }

    // 최근 90일 확인
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
    if (dateRange.startDate.toDateString() === ninetyDaysAgo.toDateString() &&
        dateRange.endDate.toDateString() === today.toDateString()) {
      return '최근 90일간';
    }

    // 커스텀 범위
    return `${formatDate(dateRange.startDate)} ~ ${formatDate(dateRange.endDate)}`;
  };

  // 초기 로딩 중일 때는 스피너를 보여줌
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
          <h2 className="text-3xl font-bold text-gray-900">캠페인 관리</h2>
          <p className="mt-1 text-sm text-gray-600">
            캠페인, 광고세트, 광고를 관리하고 선택된 기간의 성과를 확인하세요
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* 계정 선택 */}
          <CustomSelect
            options={adAccounts.map(account => ({
              value: account.account_id,
              label: account.name
            }))}
            value={selectedAccount}
            onChange={setSelectedAccount}
            placeholder="계정을 선택하세요"
            className="min-w-[200px]"
          />

          {/* 기간 선택 */}
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            className="min-w-[250px]"
          />

          {/* 로그아웃 */}
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            로그아웃
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => selectedAccount && window.location.reload()}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      )}

      {!loading && (
        <>
          {/* 캠페인 목록 */}
          {campaignView === 'list' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building size={20} />
                  캠페인 목록
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-6 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleCampaignSelect(campaign)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Building size={24} className="text-blue-600" />
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{campaign.name}</h4>
                          <p className="text-sm text-gray-500">목표: {campaign.objective}</p>
                          <p className="text-sm text-gray-500">
                            상태: <span className={campaign.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}>
                              {campaign.status === 'ACTIVE' ? '활성' : '일시정지'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(parseInt(campaign.daily_budget), 'KRW')}
                        </p>
                        <p className="text-sm text-gray-500">일 예산</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 광고세트 목록 */}
          {campaignView === 'adsets' && selectedCampaign && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Target size={20} />
                    "{selectedCampaign.name}" 광고세트
                  </h3>
                </div>
                <button
                  onClick={handleBackToCampaigns}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft size={16} />
                  캠페인으로 돌아가기
                </button>
              </div>
              <div className="divide-y divide-gray-200">
                {adSets.filter(adSet => adSet.campaign_id === selectedCampaign.id).map((adSet) => {
                  const insights = adSetInsights[adSet.id];
                  return (
                    <div
                      key={adSet.id}
                      className="p-6 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleAdSetSelect(adSet)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Target size={24} className="text-green-600" />
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{adSet.name}</h4>
                            <p className="text-sm text-gray-500">
                              타겟 연령: {adSet.targeting.age_min}-{adSet.targeting.age_max}세
                            </p>
                            <p className="text-sm text-gray-500">
                              상태: <span className={adSet.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}>
                                {adSet.status === 'ACTIVE' ? '활성' : '일시정지'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(parseInt(adSet.daily_budget), 'KRW')}
                          </p>
                          <p className="text-sm text-gray-500">일 예산</p>
                          {insights && (
                            <div className="mt-3 p-2 bg-gray-50 rounded-md">
                              <div className="text-xs text-gray-500 mb-1">{getDateRangeText()} 성과</div>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-700">
                                <div>지출: <span className="font-medium">{formatCurrency(insights.spend, 'KRW')}</span></div>
                                <div>노출: <span className="font-medium">{formatNumber(insights.impressions)}</span></div>
                                <div>클릭: <span className="font-medium">{formatNumber(insights.clicks)}</span></div>
                                <div>클릭률: <span className="font-medium">{insights.ctr}%</span></div>
                                <div>전환: <span className="font-medium text-blue-600">{insights.conversions}</span></div>
                                <div>도달: <span className="font-medium">{formatNumber(insights.reach)}</span></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 개별 광고 목록 */}
          {campaignView === 'ads' && selectedAdSet && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Palette size={20} />
                    "{selectedAdSet.name}" 개별 광고
                  </h3>
                </div>
                <button
                  onClick={handleBackToAdSets}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft size={16} />
                  광고세트로 돌아가기
                </button>
              </div>
              <div className="divide-y divide-gray-200">
                {ads.filter(ad => ad.adset_id === selectedAdSet.id).map((ad) => {
                  const insights = adInsights[ad.id];
                  return (
                    <div key={ad.id} className="p-6">
                      <div className="flex items-start space-x-4">
                        <Palette size={24} className="text-purple-600 mt-1" />
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">{ad.name}</h4>
                          <div className="mt-2 space-y-2">
                            <div>
                              <span className="text-sm font-medium text-gray-700">제목: </span>
                              <span className="text-sm text-gray-600">{ad.creative.title}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">설명: </span>
                              <span className="text-sm text-gray-600">{ad.creative.body}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">행동유도: </span>
                              <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {ad.creative.call_to_action_type}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">상태: </span>
                              <span className={`text-sm ${ad.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>
                                {ad.status === 'ACTIVE' ? '활성' : '일시정지'}
                              </span>
                            </div>
                          </div>

                          {insights && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <h5 className="text-sm font-medium text-gray-900 mb-3">{getDateRangeText()} 성과 지표</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <span className="text-gray-600">지출: </span>
                                  <span className="font-medium">{formatCurrency(insights.spend, 'KRW')}</span>
                                </div>
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
                                <div>
                                  <span className="text-gray-600">클릭당비용: </span>
                                  <span className="font-medium">{formatCurrency(insights.cpc, 'KRW')}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">도달: </span>
                                  <span className="font-medium">{formatNumber(insights.reach)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">잠재고객: </span>
                                  <span className="font-medium text-blue-600">{insights.conversions}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}