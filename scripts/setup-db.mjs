#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up Form Builder Database...\n');

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Run migrations
  console.log('\n📝 Running database migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });

  console.log('\n✅ Database setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Set up Google OAuth credentials');
  console.log('2. Run: npm run dev');
  console.log('3. Visit: http://localhost:3000/login');
} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  process.exit(1);
}
