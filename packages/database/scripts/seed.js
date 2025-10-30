const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 클라이언트 생성
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 샘플 데이터 생성 함수들
function generateSampleUsers() {
  return [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'test@example.com',
      name: '테스트 사용자',
      avatar_url: 'https://via.placeholder.com/150'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'admin@metaowners.com',
      name: '관리자',
      avatar_url: 'https://via.placeholder.com/150'
    }
  ];
}

function generateSampleAdAccounts() {
  return [
    {
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      account_id: 'act_123456789',
      account_name: '테스트 광고 계정',
      access_token: 'test_access_token_encrypted',
      currency: 'KRW',
      timezone_name: 'Asia/Seoul',
      status: 'active'
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      account_id: 'act_987654321',
      account_name: '관리자 광고 계정',
      access_token: 'admin_access_token_encrypted',
      currency: 'KRW',
      timezone_name: 'Asia/Seoul',
      status: 'active'
    }
  ];
}

function generateSampleTemplates() {
  return [
    {
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      template_name: '기본 이커머스 템플릿',
      template_type: 'campaign',
      template_data: {
        objective: 'CONVERSIONS',
        campaign_name: '{product_name} - 전환 캠페인',
        daily_budget: 50000,
        targeting: {
          age_min: 25,
          age_max: 45,
          interests: ['온라인 쇼핑', '패션', '뷰티']
        }
      },
      category: 'ecommerce'
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      template_name: '리드 생성 템플릿',
      template_type: 'adset',
      template_data: {
        optimization_goal: 'LEAD_GENERATION',
        billing_event: 'IMPRESSIONS',
        targeting: {
          age_min: 30,
          age_max: 55,
          geo_locations: { countries: ['KR'] }
        }
      },
      category: 'lead_generation'
    }
  ];
}

function generateSampleMediaAssets() {
  return [
    {
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      asset_name: '샘플 제품 이미지 1',
      asset_type: 'image',
      file_url: 'https://via.placeholder.com/1200x630/007bff/ffffff?text=Product+1',
      file_size: 245760,
      mime_type: 'image/jpeg',
      dimensions: { width: 1200, height: 630 },
      tags: ['제품', '이커머스', '블루']
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      asset_name: '샘플 제품 비디오',
      asset_type: 'video',
      file_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      file_size: 1048576,
      mime_type: 'video/mp4',
      dimensions: { width: 1280, height: 720 },
      duration: 30,
      tags: ['제품', '프로모션', '비디오']
    }
  ];
}

function generateSampleAutomationRules() {
  return [
    {
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      account_id: 'act_123456789',
      rule_name: '비용 제한 규칙',
      rule_type: 'cost_control',
      conditions: {
        metric: 'spend',
        operator: '>',
        threshold: 100000,
        time_window: '1d'
      },
      actions: {
        type: 'pause_adset',
        notify: true
      },
      is_active: true
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      account_id: 'act_123456789',
      rule_name: '성과 최적화 규칙',
      rule_type: 'performance',
      conditions: {
        metric: 'cpc',
        operator: '>',
        threshold: 5000,
        time_window: '3d'
      },
      actions: {
        type: 'decrease_budget',
        amount: 0.8,
        notify: true
      },
      is_active: true
    }
  ];
}

// 데이터 시딩 함수들
async function seedUsers() {
  console.log('👤 사용자 데이터 시딩 중...');
  const users = generateSampleUsers();

  const { data, error } = await supabase
    .from('users')
    .upsert(users, { onConflict: 'id' });

  if (error) {
    throw new Error(`사용자 시딩 실패: ${error.message}`);
  }

  console.log(`✅ ${users.length}명의 사용자 데이터 생성 완료`);
  return data;
}

async function seedAdAccounts() {
  console.log('🏢 광고 계정 데이터 시딩 중...');
  const adAccounts = generateSampleAdAccounts();

  const { data, error } = await supabase
    .from('ad_accounts')
    .upsert(adAccounts, { onConflict: 'account_id' });

  if (error) {
    throw new Error(`광고 계정 시딩 실패: ${error.message}`);
  }

  console.log(`✅ ${adAccounts.length}개의 광고 계정 데이터 생성 완료`);
  return data;
}

async function seedTemplates() {
  console.log('📝 템플릿 데이터 시딩 중...');
  const templates = generateSampleTemplates();

  const { data, error } = await supabase
    .from('templates')
    .upsert(templates, { onConflict: 'id' });

  if (error) {
    throw new Error(`템플릿 시딩 실패: ${error.message}`);
  }

  console.log(`✅ ${templates.length}개의 템플릿 데이터 생성 완료`);
  return data;
}

async function seedMediaAssets() {
  console.log('🖼️ 미디어 자산 데이터 시딩 중...');
  const mediaAssets = generateSampleMediaAssets();

  const { data, error } = await supabase
    .from('media_assets')
    .upsert(mediaAssets, { onConflict: 'id' });

  if (error) {
    throw new Error(`미디어 자산 시딩 실패: ${error.message}`);
  }

  console.log(`✅ ${mediaAssets.length}개의 미디어 자산 데이터 생성 완료`);
  return data;
}

async function seedAutomationRules() {
  console.log('⚙️ 자동화 규칙 데이터 시딩 중...');
  const rules = generateSampleAutomationRules();

  const { data, error } = await supabase
    .from('automation_rules')
    .upsert(rules, { onConflict: 'id' });

  if (error) {
    throw new Error(`자동화 규칙 시딩 실패: ${error.message}`);
  }

  console.log(`✅ ${rules.length}개의 자동화 규칙 데이터 생성 완료`);
  return data;
}

// 메인 시딩 함수
async function seedDatabase() {
  try {
    console.log('🌱 데이터베이스 시딩을 시작합니다...\n');

    // 순서대로 데이터 생성 (FK 제약 조건 고려)
    await seedUsers();
    await seedAdAccounts();
    await seedTemplates();
    await seedMediaAssets();
    await seedAutomationRules();

    console.log('\n🎉 모든 시드 데이터가 성공적으로 생성되었습니다!');

  } catch (error) {
    console.error('❌ 데이터베이스 시딩 실패:', error.message);
    process.exit(1);
  }
}

// 특정 테이블만 시딩하는 함수
async function seedSpecificTable(tableName) {
  const seedFunctions = {
    users: seedUsers,
    ad_accounts: seedAdAccounts,
    templates: seedTemplates,
    media_assets: seedMediaAssets,
    automation_rules: seedAutomationRules
  };

  const seedFunction = seedFunctions[tableName];
  if (!seedFunction) {
    console.error(`❌ 알 수 없는 테이블명: ${tableName}`);
    console.log('사용 가능한 테이블:', Object.keys(seedFunctions).join(', '));
    process.exit(1);
  }

  try {
    await seedFunction();
    console.log(`✅ ${tableName} 테이블 시딩 완료`);
  } catch (error) {
    console.error(`❌ ${tableName} 테이블 시딩 실패:`, error.message);
    process.exit(1);
  }
}

// CLI 실행
async function main() {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // 특정 테이블만 시딩
    const tableName = args[0];
    await seedSpecificTable(tableName);
  } else {
    // 전체 시딩
    await seedDatabase();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  seedDatabase,
  seedUsers,
  seedAdAccounts,
  seedTemplates,
  seedMediaAssets,
  seedAutomationRules
};