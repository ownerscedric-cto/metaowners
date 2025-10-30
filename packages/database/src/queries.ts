// 데이터베이스 쿼리 헬퍼 함수들
import { getSupabaseClient, getSupabaseAdminClient, handleDatabaseError } from './client';
import type {
  User, CreateUserInput, UpdateUserInput,
  AdAccount, CreateAdAccountInput,
  Template, CreateTemplateInput, UpdateTemplateInput, TemplateFilters,
  AdSet, CreateAdSetInput,
  Ad, CreateAdInput, AdFilters,
  MediaAsset, CreateMediaAssetInput, MediaAssetFilters,
  AutomationRule, CreateAutomationRuleInput,
  BulkUpload, CreateBulkUploadInput, UpdateBulkUploadInput, BulkUploadFilters,
  ScheduledTask, CreateScheduledTaskInput,
  ActivityLog, CreateActivityLogInput,
  AdHierarchy, UserStatistics,
  PaginationOptions, SortOptions, DatabaseResponse, PaginatedResponse
} from './types';

// ============================================================================
// 유틸리티 함수들
// ============================================================================
function buildPaginationQuery(query: any, options?: PaginationOptions) {
  if (!options) return query;

  const { page = 1, limit = 20, offset } = options;

  if (offset !== undefined) {
    return query.range(offset, offset + limit - 1);
  }

  const start = (page - 1) * limit;
  const end = start + limit - 1;
  return query.range(start, end);
}

function buildSortQuery(query: any, sort?: SortOptions) {
  if (!sort) return query.order('created_at', { ascending: false });

  return query.order(sort.column, { ascending: sort.ascending ?? true });
}

// ============================================================================
// 사용자 쿼리들
// ============================================================================
export const userQueries = {
  // 사용자 조회
  async getById(id: string): Promise<DatabaseResponse<User>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
  },

  // 이메일로 사용자 조회
  async getByEmail(email: string): Promise<DatabaseResponse<User>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
  },

  // 사용자 생성
  async create(input: CreateUserInput): Promise<DatabaseResponse<User>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('users')
        .insert(input)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
  },

  // 사용자 업데이트
  async update(id: string, input: UpdateUserInput): Promise<DatabaseResponse<User>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('users')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
  },

  // 사용자 통계 조회
  async getStatistics(userId: string): Promise<DatabaseResponse<UserStatistics>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', userId)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
  }
};

// ============================================================================
// 광고 계정 쿼리들
// ============================================================================
export const adAccountQueries = {
  // 사용자의 광고 계정 목록 조회
  async getByUserId(
    userId: string,
    options?: PaginationOptions & SortOptions
  ): Promise<PaginatedResponse<AdAccount>> {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('ad_accounts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      query = buildSortQuery(query, options);
      query = buildPaginationQuery(query, options);

      const { data, error, count } = await query;

      if (error) throw error;

      const limit = options?.limit || 20;
      const page = options?.page || 1;

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // 광고 계정 생성
  async create(input: CreateAdAccountInput): Promise<DatabaseResponse<AdAccount>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('ad_accounts')
        .insert(input)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
  },

  // 계정 ID로 조회
  async getByAccountId(accountId: string): Promise<DatabaseResponse<AdAccount>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('ad_accounts')
        .select('*')
        .eq('account_id', accountId)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
  }
};

// ============================================================================
// 템플릿 쿼리들
// ============================================================================
export const templateQueries = {
  // 사용자의 템플릿 목록 조회 (필터링 포함)
  async getByUserId(
    userId: string,
    filters?: TemplateFilters,
    options?: PaginationOptions & SortOptions
  ): Promise<PaginatedResponse<Template>> {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('templates')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // 필터 적용
      if (filters?.template_type) {
        query = query.eq('template_type', filters.template_type);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      query = buildSortQuery(query, options);
      query = buildPaginationQuery(query, options);

      const { data, error, count } = await query;

      if (error) throw error;

      const limit = options?.limit || 20;
      const page = options?.page || 1;

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // 템플릿 생성
  async create(input: CreateTemplateInput): Promise<DatabaseResponse<Template>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('templates')
        .insert(input)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
  },

  // 템플릿 업데이트
  async update(id: string, input: UpdateTemplateInput): Promise<DatabaseResponse<Template>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('templates')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
  },

  // 템플릿 사용 횟수 증가
  async incrementUsage(id: string): Promise<DatabaseResponse<null>> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.rpc('increment_template_usage', {
        template_uuid: id
      });

      return { data: null, error };
    } catch (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
  }
};

// ============================================================================
// 광고세트 쿼리들
// ============================================================================
export const adSetQueries = {
  // 계정의 광고세트 목록 조회
  async getByAccountId(
    accountId: string,
    options?: PaginationOptions & SortOptions
  ): Promise<PaginatedResponse<AdSet>> {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('ad_sets')
        .select('*', { count: 'exact' })
        .eq('account_id', accountId);

      query = buildSortQuery(query, options);
      query = buildPaginationQuery(query, options);

      const { data, error, count } = await query;

      if (error) throw error;

      const limit = options?.limit || 20;
      const page = options?.page || 1;

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // 광고세트 생성
  async create(input: CreateAdSetInput): Promise<DatabaseResponse<AdSet>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('ad_sets')
        .insert(input)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
  }
};

// ============================================================================
// 광고 쿼리들
// ============================================================================
export const adQueries = {
  // 광고 목록 조회 (필터링 포함)
  async getByFilters(
    filters: AdFilters,
    options?: PaginationOptions & SortOptions
  ): Promise<PaginatedResponse<Ad>> {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('ads')
        .select('*', { count: 'exact' });

      // 필터 적용
      if (filters.account_id) {
        query = query.eq('account_id', filters.account_id);
      }
      if (filters.campaign_id) {
        query = query.eq('campaign_id', filters.campaign_id);
      }
      if (filters.adset_id) {
        query = query.eq('adset_id', filters.adset_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      query = buildSortQuery(query, options);
      query = buildPaginationQuery(query, options);

      const { data, error, count } = await query;

      if (error) throw error;

      const limit = options?.limit || 20;
      const page = options?.page || 1;

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // 광고 생성
  async create(input: CreateAdInput): Promise<DatabaseResponse<Ad>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('ads')
        .insert(input)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
  }
};

// ============================================================================
// 미디어 자산 쿼리들
// ============================================================================
export const mediaAssetQueries = {
  // 사용자의 미디어 자산 목록 조회
  async getByUserId(
    userId: string,
    filters?: MediaAssetFilters,
    options?: PaginationOptions & SortOptions
  ): Promise<PaginatedResponse<MediaAsset>> {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('media_assets')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // 필터 적용
      if (filters?.asset_type) {
        query = query.eq('asset_type', filters.asset_type);
      }
      if (filters?.is_approved !== undefined) {
        query = query.eq('is_approved', filters.is_approved);
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      query = buildSortQuery(query, options);
      query = buildPaginationQuery(query, options);

      const { data, error, count } = await query;

      if (error) throw error;

      const limit = options?.limit || 20;
      const page = options?.page || 1;

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // 미디어 자산 생성
  async create(input: CreateMediaAssetInput): Promise<DatabaseResponse<MediaAsset>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('media_assets')
        .insert(input)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
  }
};

// ============================================================================
// 자동화 규칙 쿼리들
// ============================================================================
export const automationRuleQueries = {
  // 사용자의 자동화 규칙 목록 조회
  async getByUserId(
    userId: string,
    options?: PaginationOptions & SortOptions
  ): Promise<PaginatedResponse<AutomationRule>> {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('automation_rules')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      query = buildSortQuery(query, options);
      query = buildPaginationQuery(query, options);

      const { data, error, count } = await query;

      if (error) throw error;

      const limit = options?.limit || 20;
      const page = options?.page || 1;

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // 자동화 규칙 생성
  async create(input: CreateAutomationRuleInput): Promise<DatabaseResponse<AutomationRule>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('automation_rules')
        .insert(input)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
  }
};

// ============================================================================
// 대량 업로드 쿼리들
// ============================================================================
export const bulkUploadQueries = {
  // 사용자의 대량 업로드 목록 조회
  async getByUserId(
    userId: string,
    filters?: BulkUploadFilters,
    options?: PaginationOptions & SortOptions
  ): Promise<PaginatedResponse<BulkUpload>> {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('bulk_uploads')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // 필터 적용
      if (filters?.account_id) {
        query = query.eq('account_id', filters.account_id);
      }
      if (filters?.upload_type) {
        query = query.eq('upload_type', filters.upload_type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      query = buildSortQuery(query, options);
      query = buildPaginationQuery(query, options);

      const { data, error, count } = await query;

      if (error) throw error;

      const limit = options?.limit || 20;
      const page = options?.page || 1;

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // 대량 업로드 생성
  async create(input: CreateBulkUploadInput): Promise<DatabaseResponse<BulkUpload>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('bulk_uploads')
        .insert(input)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
  },

  // 대량 업로드 업데이트
  async update(id: string, input: UpdateBulkUploadInput): Promise<DatabaseResponse<BulkUpload>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('bulk_uploads')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
  }
};

// ============================================================================
// 예약 작업 쿼리들
// ============================================================================
export const scheduledTaskQueries = {
  // 사용자의 예약 작업 목록 조회
  async getByUserId(
    userId: string,
    options?: PaginationOptions & SortOptions
  ): Promise<PaginatedResponse<ScheduledTask>> {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('scheduled_tasks')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      query = buildSortQuery(query, options);
      query = buildPaginationQuery(query, options);

      const { data, error, count } = await query;

      if (error) throw error;

      const limit = options?.limit || 20;
      const page = options?.page || 1;

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // 예약 작업 생성
  async create(input: CreateScheduledTaskInput): Promise<DatabaseResponse<ScheduledTask>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('scheduled_tasks')
        .insert(input)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
  }
};

// ============================================================================
// 활동 로그 쿼리들
// ============================================================================
export const activityLogQueries = {
  // 사용자의 활동 로그 조회
  async getByUserId(
    userId: string,
    options?: PaginationOptions & SortOptions
  ): Promise<PaginatedResponse<ActivityLog>> {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      query = buildSortQuery(query, options);
      query = buildPaginationQuery(query, options);

      const { data, error, count } = await query;

      if (error) throw error;

      const limit = options?.limit || 20;
      const page = options?.page || 1;

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // 활동 로그 생성
  async create(input: CreateActivityLogInput): Promise<DatabaseResponse<ActivityLog>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('activity_logs')
        .insert(input)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
  }
};

// ============================================================================
// 뷰 쿼리들
// ============================================================================
export const viewQueries = {
  // 광고 계층 구조 조회
  async getAdHierarchy(
    accountId: string,
    options?: PaginationOptions & SortOptions
  ): Promise<PaginatedResponse<AdHierarchy>> {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('ad_hierarchy')
        .select('*', { count: 'exact' })
        .eq('account_id', accountId);

      query = buildSortQuery(query, options);
      query = buildPaginationQuery(query, options);

      const { data, error, count } = await query;

      if (error) throw error;

      const limit = options?.limit || 20;
      const page = options?.page || 1;

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }
};