/**
 * Test Supabase Database Connection
 * Verifies that the backend can connect to Supabase database
 * Usage: node test-connection.js (from backend directory)
 */

import { query } from './src/config/database.js';
import logger from './src/config/logger.js';

console.log('\n🔍 Testing Supabase Database Connection...\n');
console.log('=' .repeat(60));
console.log('Connection Details:');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Port: ${process.env.DB_PORT}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log(`User: ${process.env.DB_USER}`);
console.log('=' .repeat(60));
console.log('');

try {
  // Test connection with a simple query
  const result = await query('SELECT NOW() as current_time, version() as pg_version');
  console.log('✅ Database connection successful!');
  console.log(`   Current Time: ${result.rows[0].current_time}`);
  console.log(`   PostgreSQL Version: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);
  
  // Check if tables exist
  const tablesResult = await query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  
  console.log(`\n📊 Tables found: ${tablesResult.rows.length}`);
  if (tablesResult.rows.length > 0) {
    console.log('   Tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check if required tables exist
    const requiredTables = ['users', 'bank_accounts', 'checks', 'registration_codes'];
    const existingTables = tablesResult.rows.map(r => r.table_name);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log(`\n⚠️  Missing tables: ${missingTables.join(', ')}`);
      console.log('   Run migrations in Supabase SQL Editor!');
    } else {
      console.log('\n✅ All required tables exist!');
    }
  } else {
    console.log('   ⚠️  No tables found. Run migrations first!');
    console.log('   Go to: https://supabase.com/dashboard/project/tgmtqgphoqedjriwraie/sql');
  }
  
  console.log('\n✅ Connection test completed successfully!\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Connection failed!');
  console.error(`Error: ${error.message}\n`);
  
  if (error.code === 'ENOTFOUND') {
    console.error('💡 Tip: Check if DB_HOST is correct');
    console.error('   Expected: db.tgmtqgphoqedjriwraie.supabase.co');
  } else if (error.code === '28P01') {
    console.error('💡 Tip: Check if DB_USER and DB_PASSWORD are correct');
  } else if (error.code === '3D000') {
    console.error('💡 Tip: Check if DB_NAME is correct (should be "postgres")');
  } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
    console.error('💡 Tip: Check network connection or Supabase project status');
    console.error('   Verify project is active: https://supabase.com/dashboard/project/tgmtqgphoqedjriwraie');
  }
  
  console.error('\nFull error details:');
  console.error(error);
  process.exit(1);
}

