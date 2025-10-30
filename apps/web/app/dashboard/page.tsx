'use client';

import { useMetaData } from '../hooks/useMetaData';
import FacebookLogin from '../components/FacebookLogin';
import CustomSelect from '../components/CustomSelect';
import DateRangePicker from '../components/DateRangePicker';
import { Download } from 'lucide-react';

export default function DashboardPage() {
  const {
    isAuthenticated,
    loading,
    error,
    summaryData,
    dailyInsights,
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
          <h2 className="text-3xl font-bold text-gray-900">대시보드</h2>
          <p className="mt-1 text-sm text-gray-600">
            실시간 광고 성과를 확인하세요
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

      {!loading && summaryData && (
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

          {/* 상세 메트릭 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">상세 성과 지표</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <span className="text-gray-600">평균 1000노출당비용:</span>
                <span className="font-medium">{formatCurrency(summaryData.averageCPM, 'KRW')}</span>
              </div>
              <div>
                <span className="text-gray-600">평균 클릭당비용:</span>
                <span className="font-medium">{formatCurrency(summaryData.averageCPC, 'KRW')}</span>
              </div>
            </div>
          </div>

          {/* 일별 차트 */}
          {dailyInsights.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 일별 지출 추이 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">일별 지출 추이</h3>
                <div className="space-y-2">
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

              {/* 일별 잠재고객 수 추이 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">일별 잠재고객 수 추이</h3>
                <div className="space-y-2">
                  {dailyInsights.map((day, index) => {
                    const maxConversions = Math.max(...dailyInsights.map(d => d.conversions || 0));
                    const conversions = day.conversions || 0;
                    const width = maxConversions > 0 ? (conversions / maxConversions) * 100 : 0;
                    const date = new Date(day.date_start);
                    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
                    const dayName = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

                    return (
                      <div key={index} className="flex items-center space-x-3">
                        <span className="text-xs text-gray-600 w-16">{dateStr}({dayName})</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                          <div
                            className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(width, 5)}%` }}
                          >
                            <span className="text-xs text-white font-medium">
                              {conversions}명
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
        </>
      )}
    </div>
  );
}