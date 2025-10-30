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

// 삭제할 테이블 목록 (FK 제약 조건을 고려한 역순)
const TABLES_TO_RESET = [
  'activity_logs',
  'scheduled_tasks',
  'bulk_uploads',
  'automation_rules',
  'media_assets',
  'ads',
  'ad_sets',
  'templates',
  'campaign_insights',
  'campaigns',
  'alert_history',
  'alert_rules',
  'ad_accounts',
  'users'
];

// 개별 테이블 리셋 함수
async function resetTable(tableName) {
  try {
    console.log(`🗑️ ${tableName} 테이블 데이터 삭제 중...`);

    const { error } = await supabase
      .from(tableName)
      .delete()
      .neq('id', ''); // 모든 레코드 삭제

    if (error) {
      throw new Error(`${tableName} 테이블 리셋 실패: ${error.message}`);
    }

    console.log(`✅ ${tableName} 테이블 리셋 완료`);
    return true;
  } catch (error) {
    console.error(`❌ ${tableName} 테이블 리셋 실패:`, error.message);
    return false;
  }
}

// 특정 테이블들만 리셋
async function resetSpecificTables(tableNames) {
  try {
    console.log(`🔄 지정된 테이블들을 리셋합니다: ${tableNames.join(', ')}\n`);

    let successCount = 0;
    for (const tableName of tableNames) {
      if (TABLES_TO_RESET.includes(tableName)) {
        const success = await resetTable(tableName);
        if (success) {
          successCount++;
        }
      } else {
        console.warn(`⚠️ 알 수 없는 테이블명: ${tableName}`);
      }
    }

    console.log(`\n📊 리셋 결과: ${successCount}/${tableNames.length} 성공`);

    if (successCount === tableNames.length) {
      console.log('🎉 모든 지정된 테이블이 성공적으로 리셋되었습니다!');
    }

  } catch (error) {
    console.error('❌ 테이블 리셋 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 전체 데이터베이스 리셋
async function resetDatabase() {
  try {
    console.log('🔄 전체 데이터베이스를 리셋합니다...\n');
    console.log('⚠️ 이 작업은 모든 데이터를 삭제합니다!');

    let successCount = 0;
    for (const tableName of TABLES_TO_RESET) {
      const success = await resetTable(tableName);
      if (success) {
        successCount++;
      } else {
        console.log('\n❌ 테이블 리셋이 실패했습니다. 중단합니다.');
        break;
      }
    }

    console.log(`\n📊 리셋 결과: ${successCount}/${TABLES_TO_RESET.length} 성공`);

    if (successCount === TABLES_TO_RESET.length) {
      console.log('🎉 전체 데이터베이스가 성공적으로 리셋되었습니다!');
    }

  } catch (error) {
    console.error('❌ 데이터베이스 리셋 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// Supabase의 시퀀스 리셋 (필요시)
async function resetSequences() {
  try {
    console.log('🔢 시퀀스 리셋 중...');

    // PostgreSQL 시퀀스 리셋 쿼리들
    const sequenceResetQueries = [
      "SELECT setval(pg_get_serial_sequence('users', 'id'), 1, false);",
      "SELECT setval(pg_get_serial_sequence('ad_accounts', 'id'), 1, false);",
      // 필요한 다른 시퀀스들...
    ];

    for (const query of sequenceResetQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.warn(`⚠️ 시퀀스 리셋 경고: ${error.message}`);
      }
    }

    console.log('✅ 시퀀스 리셋 완료');
  } catch (error) {
    console.warn('⚠️ 시퀀스 리셋 중 오류 (무시 가능):', error.message);
  }
}

// 확인 프롬프트 (운영 환경에서 사용)
async function confirmReset() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('🚨 정말로 데이터베이스를 리셋하시겠습니까? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

// 데이터베이스 통계 확인
async function checkDatabaseStats() {
  try {
    console.log('📊 현재 데이터베이스 상태 확인 중...\n');

    for (const tableName of TABLES_TO_RESET) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`❌ ${tableName}: 오류 - ${error.message}`);
        } else {
          console.log(`📋 ${tableName}: ${count || 0}개 레코드`);
        }
      } catch (err) {
        console.log(`⚠️ ${tableName}: 확인 불가`);
      }
    }
  } catch (error) {
    console.error('❌ 데이터베이스 상태 확인 실패:', error.message);
  }
}

// CLI 실행 함수
async function main() {
  const args = process.argv.slice(2);

  // 명령어 파싱
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔄 데이터베이스 리셋 도구

사용법:
  node reset.js                    # 전체 데이터베이스 리셋
  node reset.js --tables users ads # 특정 테이블들만 리셋
  node reset.js --stats            # 현재 상태만 확인
  node reset.js --confirm          # 확인 프롬프트와 함께 리셋
  node reset.js --help             # 이 도움말 표시

사용 가능한 테이블:
  ${TABLES_TO_RESET.join(', ')}
    `);
    return;
  }

  if (args.includes('--stats')) {
    await checkDatabaseStats();
    return;
  }

  if (args.includes('--tables')) {
    const tablesIndex = args.indexOf('--tables');
    const tableNames = args.slice(tablesIndex + 1);

    if (tableNames.length === 0) {
      console.error('❌ --tables 옵션 뒤에 테이블명을 지정해주세요.');
      console.log('사용 가능한 테이블:', TABLES_TO_RESET.join(', '));
      process.exit(1);
    }

    await resetSpecificTables(tableNames);
    return;
  }

  // 전체 리셋
  if (args.includes('--confirm')) {
    const confirmed = await confirmReset();
    if (!confirmed) {
      console.log('❌ 리셋이 취소되었습니다.');
      return;
    }
  }

  await resetDatabase();

  if (args.includes('--with-sequences')) {
    await resetSequences();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  resetDatabase,
  resetTable,
  resetSpecificTables,
  checkDatabaseStats
};