/**
 * Script to create test users for development/testing
 * Run with: node scripts/create-test-users.js
 * 
 * Make sure your .env file is configured with Supabase credentials
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const testUsers = [
  {
    email: 'admin@society.com',
    password: 'Admin123!',
    fullName: 'Super Admin',
    phone: '+1234567890',
    role: 'SUPER_ADMIN'
  },
  {
    email: 'board@society.com',
    password: 'Board123!',
    fullName: 'Board Member',
    phone: '+1234567891',
    role: 'BOARD_MEMBER'
  },
  {
    email: 'member@society.com',
    password: 'Member123!',
    fullName: 'John Doe',
    phone: '+1234567892',
    role: 'MEMBER'
  }
];

async function createTestUsers() {
  console.log('🚀 Creating test users...\n');

  for (const user of testUsers) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(user.email);
      
      if (existingUser?.user) {
        console.log(`⏭️  User ${user.email} already exists, skipping...`);
        continue;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });

      if (authError) {
        console.error(`❌ Failed to create auth user ${user.email}:`, authError.message);
        continue;
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          full_name: user.fullName,
          phone: user.phone,
          role: user.role
        });

      if (profileError) {
        console.error(`❌ Failed to create profile for ${user.email}:`, profileError.message);
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        continue;
      }

      console.log(`✅ Created ${user.role}: ${user.email} (Password: ${user.password})`);
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error.message);
    }
  }

  console.log('\n✨ Test users creation completed!');
  console.log('\n📋 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  testUsers.forEach(user => {
    console.log(`\n${user.role}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

createTestUsers().catch(console.error);
