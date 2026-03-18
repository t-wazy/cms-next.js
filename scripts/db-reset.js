#!/usr/bin/env node
/**
 * データベースリセットスクリプト
 * 環境を自動検出してPrismaマイグレーションを実行します
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// コマンドライン引数を解析
const args = process.argv.slice(2);
const forceFlag = args.includes('--force');
const envArg = args.find(arg => arg.startsWith('--env='));
const specifiedEnv = envArg ? envArg.split('=')[1] : null;

/**
 * Docker MySQLが起動しているかチェック
 */
function isDockerMySQLRunning() {
  try {
    const output = execSync('docker ps --filter "name=cms_mysql" --format "{{.Names}}"', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    return output.trim() === 'cms_mysql';
  } catch (error) {
    return false;
  }
}

/**
 * ローカルMySQLが起動しているかチェック（ポート3306）
 */
function isLocalMySQLRunning() {
  try {
    // Windows: netstat、Linux/Mac: lsof または netstat
    const command = process.platform === 'win32'
      ? 'netstat -an | findstr ":3306"'
      : 'lsof -i :3306 || netstat -an | grep :3306';

    execSync(command, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 使用する環境ファイルを決定
 */
function determineEnvFile() {
  if (specifiedEnv) {
    const envFile = `.env.${specifiedEnv}`;
    if (!fs.existsSync(envFile)) {
      console.error(`❌ 指定された環境ファイルが見つかりません: ${envFile}`);
      process.exit(1);
    }
    return envFile;
  }

  // 環境を自動検出
  const dockerRunning = isDockerMySQLRunning();
  const localRunning = isLocalMySQLRunning();

  console.log('🔍 環境を検出中...');
  console.log(`  - Docker MySQL (ポート3307): ${dockerRunning ? '✅ 起動中' : '❌ 停止'}`);
  console.log(`  - ローカルMySQL (ポート3306): ${localRunning ? '✅ 起動中' : '❌ 停止'}`);

  if (dockerRunning && fs.existsSync('.env.docker')) {
    console.log('📦 Docker環境を使用します (.env.docker)');
    return '.env.docker';
  }

  if (localRunning && fs.existsSync('.env.local')) {
    console.log('💻 ローカル環境を使用します (.env.local)');
    return '.env.local';
  }

  if (fs.existsSync('.env')) {
    console.log('⚙️  デフォルト環境を使用します (.env)');
    return '.env';
  }

  console.error('❌ 使用可能な環境ファイルが見つかりません');
  console.error('   .env, .env.local, または .env.docker を作成してください');
  process.exit(1);
}

/**
 * Prismaマイグレーションリセットを実行
 */
function runPrismaReset(envFile) {
  console.log('\n🗃️  データベースをリセットします...');
  console.log(`   環境ファイル: ${envFile}`);

  // 環境変数を読み込み
  require('dotenv').config({ path: envFile });

  // CI環境や非インタラクティブ環境では自動的に--forceを追加
  const isCI = process.env.CI === 'true' || !process.stdout.isTTY;
  const shouldForce = forceFlag || isCI;
  const forceOption = shouldForce ? '--force' : '';
  const command = `pnpm prisma migrate reset --skip-generate ${forceOption}`.trim();

  console.log(`   実行コマンド: ${command}\n`);

  try {
    execSync(command, {
      stdio: 'inherit',
      env: { ...process.env }
    });

    console.log('\n✅ データベースのリセットが完了しました！');
  } catch (error) {
    console.error('\n❌ データベースのリセットに失敗しました');
    process.exit(1);
  }
}

// メイン処理
console.log('🚀 データベースリセットスクリプト\n');

const envFile = determineEnvFile();
runPrismaReset(envFile);
