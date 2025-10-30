const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Supabase 클라이언트 생성
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 마이그레이션 실행 함수
async function runMigration(filename) {
  try {
    console.log(`📄 마이그레이션 파일 실행 중: ${filename}`);

    const migrationPath = path.join(__dirname, '..', 'migrations', filename);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`마이그레이션 파일을 찾을 수 없습니다: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // SQL을 여러 명령문으로 분할 (세미콜론 기준)
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    console.log(`📝 ${statements.length}개의 SQL 명령문을 실행합니다...`);

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error('❌ SQL 실행 에러:', error);
          throw error;
        }
      }
    }

    console.log(`✅ 마이그레이션 완료: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ 마이그레이션 실패: ${filename}`, error.message);
    return false;
  }
}

// 모든 마이그레이션 파일 실행
async function runAllMigrations() {
  try {
    console.log('🚀 데이터베이스 마이그레이션을 시작합니다...\n');

    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // 파일명 순서대로 정렬

    if (files.length === 0) {
      console.log('📝 실행할 마이그레이션 파일이 없습니다.');
      return;
    }

    console.log(`📁 발견된 마이그레이션 파일: ${files.length}개\n`);

    let successCount = 0;
    for (const file of files) {
      const success = await runMigration(file);
      if (success) {
        successCount++;
      } else {
        console.log('\n❌ 마이그레이션이 실패했습니다. 중단합니다.');
        break;
      }
      console.log(''); // 구분을 위한 빈 줄
    }

    console.log(`📊 마이그레이션 결과: ${successCount}/${files.length} 성공`);

    if (successCount === files.length) {
      console.log('🎉 모든 마이그레이션이 성공적으로 완료되었습니다!');
    }

  } catch (error) {
    console.error('❌ 마이그레이션 실행 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 특정 마이그레이션 파일 실행 (CLI 인자로 지정)
async function main() {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // 특정 파일 실행
    const filename = args[0];
    await runMigration(filename);
  } else {
    // 모든 마이그레이션 실행
    await runAllMigrations();
  }
}

if (require.main === module) {
  main();
}

module.exports = { runMigration, runAllMigrations };