import { createClient, SupabaseClient } from '@supabase/supabase-js';
// Database 타입은 Supabase CLI로 생성하거나 수동으로 정의해야 합니다
type Database = any;

// Supabase 클라이언트 타입
export type DatabaseClient = SupabaseClient<Database>;

// 환경변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL 환경변수가 설정되지 않았습니다.');
}

if (!supabaseAnonKey && !supabaseServiceKey) {
  throw new Error('SUPABASE_ANON_KEY 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.');
}

// 클라이언트용 Supabase 인스턴스 (브라우저, 일반 서버)
let supabaseClient: DatabaseClient | null = null;

export function getSupabaseClient(): DatabaseClient {
  if (!supabaseClient && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl!, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }

  if (!supabaseClient) {
    throw new Error('Supabase 클라이언트를 초기화할 수 없습니다.');
  }

  return supabaseClient;
}

// 서비스 역할용 Supabase 인스턴스 (관리자 권한, 마이그레이션용)
let supabaseAdminClient: DatabaseClient | null = null;

export function getSupabaseAdminClient(): DatabaseClient {
  if (!supabaseAdminClient && supabaseServiceKey) {
    supabaseAdminClient = createClient(supabaseUrl!, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  if (!supabaseAdminClient) {
    throw new Error('Supabase 관리자 클라이언트를 초기화할 수 없습니다. SERVICE_ROLE_KEY가 필요합니다.');
  }

  return supabaseAdminClient;
}

// 연결 상태 확인 함수
export async function checkConnection(client?: DatabaseClient): Promise<boolean> {
  try {
    const supabase = client || getSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact', head: true });

    return !error;
  } catch (error) {
    console.error('데이터베이스 연결 확인 실패:', error);
    return false;
  }
}

// 사용자 인증 상태 확인
export async function getCurrentUser(client?: DatabaseClient) {
  try {
    const supabase = client || getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('사용자 인증 상태 확인 실패:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('사용자 정보 가져오기 실패:', error);
    return null;
  }
}

// 실시간 구독 설정을 위한 유틸리티
export function subscribeToTable<T>(
  tableName: string,
  callback: (payload: any) => void,
  filter?: string,
  client?: DatabaseClient
) {
  const supabase = client || getSupabaseClient();

  let subscription = supabase
    .channel(`${tableName}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
        ...(filter && { filter })
      },
      callback
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

// 배치 작업을 위한 트랜잭션 유틸리티
export async function withTransaction<T>(
  operation: (client: DatabaseClient) => Promise<T>,
  client?: DatabaseClient
): Promise<T> {
  const supabase = client || getSupabaseClient();

  try {
    // Supabase에서는 명시적 트랜잭션이 제한적이므로
    // 에러 발생시 롤백 로직을 직접 구현해야 할 수 있습니다
    const result = await operation(supabase);
    return result;
  } catch (error) {
    console.error('트랜잭션 실행 중 오류:', error);
    throw error;
  }
}

// 헬스 체크 함수
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  details: {
    database: boolean;
    auth: boolean;
    realtime: boolean;
  };
}> {
  const timestamp = new Date().toISOString();

  try {
    const supabase = getSupabaseClient();

    // 데이터베이스 연결 확인
    const dbHealthy = await checkConnection(supabase);

    // 인증 서비스 확인 (세션 상태만 확인)
    let authHealthy = false;
    try {
      const { error } = await supabase.auth.getSession();
      authHealthy = !error;
    } catch {
      authHealthy = false;
    }

    // 실시간 서비스 확인 (채널 생성 가능 여부)
    let realtimeHealthy = false;
    try {
      const channel = supabase.channel('health-check');
      realtimeHealthy = !!channel;
      channel.unsubscribe();
    } catch {
      realtimeHealthy = false;
    }

    const allHealthy = dbHealthy && authHealthy && realtimeHealthy;

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp,
      details: {
        database: dbHealthy,
        auth: authHealthy,
        realtime: realtimeHealthy
      }
    };
  } catch (error) {
    console.error('헬스 체크 실패:', error);
    return {
      status: 'unhealthy',
      timestamp,
      details: {
        database: false,
        auth: false,
        realtime: false
      }
    };
  }
}

// 에러 처리 유틸리티
export function handleDatabaseError(error: any): {
  code: string;
  message: string;
  details?: any;
} {
  if (error?.code) {
    return {
      code: error.code,
      message: error.message || '데이터베이스 오류가 발생했습니다.',
      details: error.details
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: error?.message || '알 수 없는 오류가 발생했습니다.',
    details: error
  };
}

// 기본 내보내기
export default getSupabaseClient;