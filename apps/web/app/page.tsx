import { Suspense } from 'react'

// 로딩 컴포넌트
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}

// 메트릭 카드 컴포넌트
function MetricCard({
  title,
  value,
  change,
  changeType
}: {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
}) {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }[changeType]

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`text-sm font-medium ${changeColor}`}>
          {change}
        </div>
      </div>
    </div>
  )
}

// 대시보드 컴포넌트
function Dashboard() {
  // 실제로는 API에서 데이터를 가져올 예정
  const metrics = [
    { title: '총 지출', value: '₩1,234,567', change: '+12%', changeType: 'positive' as const },
    { title: '노출량', value: '2,345,678', change: '+8%', changeType: 'positive' as const },
    { title: '클릭수', value: '12,345', change: '-2%', changeType: 'negative' as const },
    { title: 'CTR', value: '0.53%', change: '+0.1%', changeType: 'positive' as const },
  ]

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">대시보드</h2>
        <p className="mt-2 text-gray-600">실시간 광고 성과를 모니터링하세요</p>
      </div>

      {/* 메트릭 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* 차트 영역 (임시) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">성과 트렌드</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-lg">차트가 여기에 표시됩니다</p>
            <p className="text-gray-400 text-sm mt-2">Chart.js 또는 Recharts 구현 예정</p>
          </div>
        </div>
      </div>

      {/* 최근 캠페인 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 캠페인</h3>
        <div className="space-y-3">
          {[
            { name: '여름 세일 캠페인', status: '활성', spend: '₩45,000', impressions: '123,456' },
            { name: '브랜드 인지도 캠페인', status: '활성', spend: '₩32,000', impressions: '89,012' },
            { name: '리타겟팅 캠페인', status: '일시정지', spend: '₩18,000', impressions: '45,678' },
          ].map((campaign, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{campaign.name}</p>
                <p className="text-sm text-gray-600">상태: {campaign.status}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{campaign.spend}</p>
                <p className="text-sm text-gray-600">{campaign.impressions} 노출</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 연결 상태 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-orange-400 rounded-full mr-3"></div>
          <div>
            <p className="font-medium text-blue-900">Facebook 계정 연결 필요</p>
            <p className="text-sm text-blue-700 mt-1">
              실시간 데이터를 보려면 Facebook 광고 계정을 연결해주세요.
            </p>
            <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
              계정 연결하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  )
}