/**
 * Script to apply the email migration to Supabase
 * Usage: node apply-migration.cjs
 */

require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Applying Email Migration to Supabase');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const { createClient } = require('@supabase/supabase-js');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('📋 Migration SQL:');
    const migrationSQL = `
      -- Add email column
      ALTER TABLE public.subscriptions
      ADD COLUMN IF NOT EXISTS email TEXT;

      -- Add index for faster email lookups
      CREATE INDEX IF NOT EXISTS subscriptions_email_idx
      ON public.subscriptions(email);
    `;

    console.log(migrationSQL);

    console.log('\n⚠️  IMPORTANT:');
    console.log('This script cannot execute raw SQL directly.');
    console.log('You need to apply the migration manually.\n');

    console.log('📝 Option 1: Supabase Dashboard (Recommended)');
    console.log('1. Go to: https://supabase.com/dashboard/project/imcfossyagdkgyfyjgmh/sql/new');
    console.log('2. Paste the SQL from: supabase/migrations/002_add_email_to_subscriptions.sql');
    console.log('3. Click "Run"\n');

    console.log('📝 Option 2: Supabase CLI');
    console.log('1. Install Supabase CLI: npm install -g supabase');
    console.log('2. Link project: supabase link --project-ref imcfossyagdkgyfyjgmh');
    console.log('3. Apply migration: supabase db push\n');

    console.log('📝 Option 3: Direct Query via This Script');
    console.log('Note: This requires pg library and direct DB connection.\n');

    console.log('✅ After applying migration, verify with:');
    console.log('   SELECT column_name, data_type FROM information_schema.columns');
    console.log('   WHERE table_name = \'subscriptions\' ORDER BY ordinal_position;\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('Migration file location:');
    console.log('D:\\Projects\\yachtinterior\\supabase\\migrations\\002_add_email_to_subscriptions.sql');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applyMigration();
