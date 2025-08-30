#!/usr/bin/env node

/**
 * Test script for Job Seeder
 * Usage: node test-seed-jobs.js
 */

const JobSeeder = require('./seed-jobs');

async function runTests() {
  console.log('🧪 Testing Job Seeder...\n');

  // Test 1: Help command
  console.log('✅ Test 1: Help command');
  process.argv = ['node', 'test-seed-jobs.js', '--help'];
  const seeder1 = new JobSeeder();
  seeder1.showHelp();

  // Test 2: Dry run mode
  console.log('\n✅ Test 2: Dry run mode');
  process.argv = ['node', 'test-seed-jobs.js', '--dry-run'];
  const seeder2 = new JobSeeder();
  
  try {
    await seeder2.connect();
    const sqlContent = seeder2.readSQLFile();
    console.log(`   📄 SQL file loaded: ${(sqlContent.length / 1024).toFixed(2)} KB`);
    
    const result = await seeder2.executeSeed(sqlContent);
    console.log(`   🔍 Dry run result: ${result.dryRun ? 'SUCCESS' : 'FAILED'}`);
    
    await seeder2.disconnect();
  } catch (error) {
    console.error(`   ❌ Test failed: ${error.message}`);
  }

  // Test 3: Check existing data function
  console.log('\n✅ Test 3: Check existing data');
  process.argv = ['node', 'test-seed-jobs.js'];
  const seeder3 = new JobSeeder();
  
  try {
    await seeder3.connect();
    const existing = await seeder3.checkExistingData();
    console.log(`   📊 Found ${existing.companies.length} companies, ${existing.totalJobs} jobs`);
    await seeder3.disconnect();
  } catch (error) {
    console.error(`   ❌ Test failed: ${error.message}`);
  }

  console.log('\n🎉 All tests completed!');
}

if (require.main === module) {
  runTests().catch(console.error);
}
