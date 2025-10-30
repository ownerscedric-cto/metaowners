'use client';

import { useMetaData } from '../hooks/useMetaData';
import FacebookLogin from '../components/FacebookLogin';
import CustomSelect from '../components/CustomSelect';
import DateRangePicker from '../components/DateRangePicker';
import { Download, TrendingUp, BarChart3, Target } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AnalysisPage() {
  const {
    isAuthenticated,
    loading,
    error,
    campaigns,
    adSets,
    ads,
    adInsights,
    allLoadedAds,
    allLoadedAdSets,
    allLoadedAdInsights,
    dailyInsights,
    dateRange,
    setDateRange,
    selectedAccount,
    setSelectedAccount,
    adAccounts,
    handleLoginSuccess,
    handleLogout,
    setError,
    initialLoading,
  } = useMetaData();

  // Excel 다운로드 함수
  const downloadExcel = (data: any[], filename: string, sheetName: string) => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    const colWidths = Object.keys(data[0] || {}).map(key => {
      const maxLength = Math.max(key.length, ...data.map(row => String(row[key] || '').length));
      return { wch: Math.min(maxLength + 2, 50) };
    });
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const exportAllData = () => {
    const allData: any[] = [];

    console.log('선택된 기간 데이터 확인:', {
      campaigns: campaigns.length,
      adSets: adSets.length,
      ads: ads.length,
      adInsights: Object.keys(adInsights).length,
      dateRange: dateRange
    });

    // 현재 선택된 날짜 범위에 맞는 광고 데이터를 기준으로 데이터 생성
    ads.forEach(ad => {
      // 해당 광고의 광고세트 찾기
      const adSet = adSets.find(as => as.id === ad.adset_id);
      // 해당 광고세트의 캠페인 찾기
      const campaign = adSet ? campaigns.find(c => c.id === adSet.campaign_id) : null;
      // 광고 성과 데이터 (선택된 날짜 범위에 맞는 데이터)
      const insights = adInsights[ad.id];

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
    const dateRangeLabel = dateRange.startDate && dateRange.endDate
      ? `${dateRange.startDate.toISOString().split('T')[0]}_${dateRange.endDate.toISOString().split('T')[0]}`
      : today;
    downloadExcel(allData, `메타광고_개별분석데이터_${dateRangeLabel}`, '개별광고분석');
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
          <h2 className="text-3xl font-bold text-gray-900">성과 분석</h2>
          <p className="mt-1 text-sm text-gray-600">
            광고 성과를 분석하고 데이터를 내보내세요
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
        <div className="space-y-6">
          {/* Excel 다운로드 섹션 */}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-900">{campaigns.length}</p>
                <p className="text-sm text-blue-700">총 캠페인 수</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-900">{adSets.length}</p>
                <p className="text-sm text-green-700">선택된 기간 광고세트 수</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-900">{ads.length}</p>
                <p className="text-sm text-purple-700">선택된 기간 광고 수</p>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-600">
              <p className="mb-2">다운로드 파일에 포함되는 정보:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>캠페인 정보: 캠페인명, 일예산, 상태</li>
                <li>광고세트 정보: 광고세트명, 일예산, 타겟연령</li>
                <li>광고 정보: 광고명, 제목, 설명, 상태</li>
                <li>성과 데이터: 지출, 노출, 클릭, 클릭률, 클릭당비용, 1000노출당비용, 도달, 잠재고객수, 잠재고객당비용</li>
              </ul>
            </div>
          </div>

          {/* 일별 분석 차트 */}
          {dailyInsights.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
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
                            {new Intl.NumberFormat('ko-KR', {
                              style: 'currency',
                              currency: 'KRW',
                            }).format(day.spend)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 캠페인별 성과 요약 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Target size={20} className="text-green-600" />
              캠페인별 성과
            </h4>
            <div className="space-y-4">
              {campaigns.map((campaign) => {
                const campaignAdSets = adSets.filter(adSet => adSet.campaign_id === campaign.id);
                const campaignAds = ads.filter(ad => {
                  const adSet = adSets.find(as => as.id === ad.adset_id);
                  return adSet && adSet.campaign_id === campaign.id;
                });

                return (
                  <div key={campaign.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-medium text-gray-900">{campaign.name}</h5>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        campaign.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {campaign.status === 'ACTIVE' ? '활성' : '일시정지'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">광고세트: </span>
                        <span className="font-medium">{campaignAdSets.length}개</span>
                      </div>
                      <div>
                        <span className="text-gray-600">광고: </span>
                        <span className="font-medium">{campaignAds.length}개</span>
                      </div>
                      <div>
                        <span className="text-gray-600">일예산: </span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('ko-KR', {
                            style: 'currency',
                            currency: 'KRW',
                          }).format(parseInt(campaign.daily_budget))}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}