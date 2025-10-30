// 데이터베이스 유틸리티 함수들
import { getSupabaseClient, getSupabaseAdminClient } from './client';
import { activityLogQueries } from './queries';
import type { CreateActivityLogInput } from './types';

// ============================================================================
// 활동 로그 유틸리티
// ============================================================================
export async function logActivity(input: CreateActivityLogInput) {
  try {
    return await activityLogQueries.create(input);
  } catch (error) {
    console.error('활동 로그 기록 실패:', error);
    // 로그 실패가 메인 작업을 방해하지 않도록 에러를 던지지 않음
  }
}

// ============================================================================
// 데이터 검증 유틸리티
// ============================================================================
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateFacebookId(id: string): boolean {
  // Facebook ID는 숫자로만 구성되며, 보통 15-17자리
  const facebookIdRegex = /^\d{15,17}$/;
  return facebookIdRegex.test(id);
}

export function validateCronExpression(cron: string): boolean {
  // 간단한 cron 표현식 검증 (5개 또는 6개 필드)
  const cronRegex = /^(\*|[0-9,\-/]+)\s+(\*|[0-9,\-/]+)\s+(\*|[0-9,\-/]+)\s+(\*|[0-9,\-/]+)\s+(\*|[0-9,\-/]+)(\s+(\*|[0-9,\-/]+))?$/;
  return cronRegex.test(cron);
}

// ============================================================================
// 데이터 변환 유틸리티
// ============================================================================
export function formatCurrency(amount: number, currency: string = 'KRW'): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num);
}

export function formatDate(date: string | Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  let options: Intl.DateTimeFormatOptions;

  switch (format) {
    case 'short':
      options = { year: '2-digit', month: 'numeric', day: 'numeric' };
      break;
    case 'medium':
      options = { year: 'numeric', month: 'short', day: 'numeric' };
      break;
    case 'long':
      options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      break;
    default:
      options = { year: 'numeric', month: 'short', day: 'numeric' };
  }

  return new Intl.DateTimeFormat('ko-KR', options).format(dateObj);
}

// ============================================================================
// 파일 처리 유틸리티
// ============================================================================
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '지원되지 않는 이미지 형식입니다.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: '파일 크기가 10MB를 초과합니다.' };
  }

  return { valid: true };
}

export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  const maxSize = 100 * 1024 * 1024; // 100MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '지원되지 않는 비디오 형식입니다.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: '파일 크기가 100MB를 초과합니다.' };
  }

  return { valid: true };
}

// ============================================================================
// 태그 처리 유틸리티
// ============================================================================
export function normalizeTags(tags: string[]): string[] {
  return tags
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0)
    .filter((tag, index, array) => array.indexOf(tag) === index) // 중복 제거
    .slice(0, 10); // 최대 10개로 제한
}

export function searchByTags(itemTags: string[], searchTags: string[]): boolean {
  if (searchTags.length === 0) return true;
  return searchTags.some(searchTag =>
    itemTags.some(itemTag => itemTag.includes(searchTag))
  );
}

// ============================================================================
// 텍스트 처리 유틸리티
// ============================================================================
export function sanitizeHtml(html: string): string {
  // 간단한 HTML 태그 제거 (실제 환경에서는 DOMPurify 등 사용 권장)
  return html.replace(/<[^>]*>/g, '');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^가-힣a-z0-9 -]/g, '') // 한글, 영문, 숫자, 공백, 하이픈만 허용
    .replace(/\s+/g, '-') // 공백을 하이픈으로 변경
    .replace(/-+/g, '-') // 연속된 하이픈을 하나로
    .trim();
}

// ============================================================================
// Facebook 광고 관련 유틸리티
// ============================================================================
export function parseTargeting(targeting: any): {
  ageRange: string;
  locations: string[];
  interests: string[];
  behaviors: string[];
} {
  return {
    ageRange: targeting.age_min && targeting.age_max
      ? `${targeting.age_min}-${targeting.age_max}세`
      : '전체',
    locations: targeting.geo_locations?.countries || [],
    interests: targeting.interests?.map((i: any) => i.name) || [],
    behaviors: targeting.behaviors?.map((b: any) => b.name) || []
  };
}

export function formatAdStatus(status: string): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    'ACTIVE': { label: '활성', color: 'green' },
    'PAUSED': { label: '일시정지', color: 'yellow' },
    'DELETED': { label: '삭제됨', color: 'red' },
    'ARCHIVED': { label: '보관됨', color: 'gray' }
  };

  return statusMap[status] || { label: status, color: 'gray' };
}

export function calculateCostMetrics(spend: number, impressions: number, clicks: number, conversions: number) {
  return {
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    costPerConversion: conversions > 0 ? spend / conversions : 0,
    conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0
  };
}

// ============================================================================
// 데이터 내보내기 유틸리티
// ============================================================================
export function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        let value = row[header];
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        if (typeof value === 'string' && value.includes(',')) {
          value = `"${value}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
}

export function downloadCSV(data: any[], filename: string) {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// ============================================================================
// 성능 분석 유틸리티
// ============================================================================
export function analyzePerformance(insights: any[]): {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCPM: number;
  averageCPC: number;
  averageCTR: number;
  averageConversionRate: number;
} {
  if (insights.length === 0) {
    return {
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      averageCPM: 0,
      averageCPC: 0,
      averageCTR: 0,
      averageConversionRate: 0
    };
  }

  const totals = insights.reduce((acc, insight) => {
    acc.spend += insight.spend || 0;
    acc.impressions += insight.impressions || 0;
    acc.clicks += insight.clicks || 0;
    acc.conversions += insight.conversions || 0;
    return acc;
  }, { spend: 0, impressions: 0, clicks: 0, conversions: 0 });

  return {
    totalSpend: totals.spend,
    totalImpressions: totals.impressions,
    totalClicks: totals.clicks,
    totalConversions: totals.conversions,
    averageCPM: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
    averageCPC: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    averageCTR: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    averageConversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0
  };
}

// ============================================================================
// 데이터베이스 백업 유틸리티
// ============================================================================
export async function createBackup(tables: string[] = []): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = getSupabaseAdminClient();

    // 실제 백업은 Supabase CLI나 pg_dump 등을 사용해야 함
    // 여기서는 중요한 데이터만 JSON으로 백업하는 예시
    const backupData: any = {};

    const defaultTables = ['users', 'ad_accounts', 'templates', 'automation_rules'];
    const tablesToBackup = tables.length > 0 ? tables : defaultTables;

    for (const table of tablesToBackup) {
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        console.error(`${table} 백업 실패:`, error);
        continue;
      }

      backupData[table] = data;
    }

    const backupJson = JSON.stringify(backupData, null, 2);
    const timestamp = new Date().toISOString().split('T')[0];

    // 로컬 다운로드 (브라우저 환경에서)
    if (typeof window !== 'undefined') {
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `metaowners_backup_${timestamp}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }

    return { success: true, message: '백업이 성공적으로 생성되었습니다.' };
  } catch (error) {
    console.error('백업 생성 실패:', error);
    return { success: false, message: '백업 생성에 실패했습니다.' };
  }
}

// ============================================================================
// 에러 리포팅 유틸리티
// ============================================================================
export async function reportError(error: any, context: string) {
  try {
    const errorData = {
      message: error.message || '알 수 없는 오류',
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server'
    };

    // 실제 환경에서는 에러 추적 서비스(Sentry, LogRocket 등)로 전송
    console.error('Error Report:', errorData);

    // 데이터베이스에 에러 로그 저장
    await logActivity({
      action: 'error_occurred',
      entity_type: 'user',
      metadata: errorData
    });
  } catch (reportingError) {
    console.error('에러 리포팅 실패:', reportingError);
  }
}