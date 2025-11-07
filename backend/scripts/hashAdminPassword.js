/*
 * Script: Hash the admin user's password
 * Usage: node backend/scripts/hashAdminPassword.js
 */
const connectDB = require('../config/database')
const User = require('../models/User')
const bcrypt = require('bcryptjs')

async function run() {
  try {
    await connectDB()

    console.log('\n=== HASHING ADMIN USER PASSWORD ===\n')
    
    const adminUser = await User.findOne({ email: 'deepak@gmail.com' })
    
    if (!adminUser) {
      console.log('❌ Admin user not found!')
      process.exit(1)
    }
    
    console.log(`Found admin user: ${adminUser.name} (${adminUser.email})`)
    console.log(`Current password storage: ${adminUser.password.startsWith('$2') ? 'Hashed' : 'Plain text'}`)
    
    // Check if already hashed
    if (adminUser.password.startsWith('$2')) {
      console.log('✅ Password is already hashed. No changes needed.')
      process.exit(0)
    }
    
    // Hash the password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(adminUser.password, saltRounds)
    
    // Update the user
    adminUser.password = hashedPassword
    await adminUser.save()
    
    console.log('✅ Password has been hashed and saved successfully!')
    console.log(`   Old password (plain text): "${adminUser.password.substring(0, 7)}..." (hidden)`)
    console.log(`   New password (hashed): "${hashedPassword.substring(0, 20)}..."`)
    
    // Verify the hash works
    const testMatch = await bcrypt.compare('2434325', hashedPassword)
    if (testMatch) {
      console.log('✅ Hash verification successful - password can still be used for login')
    } else {
      console.log('⚠️  Warning: Hash verification failed - please check the original password')
    }
    
  } catch (err) {
    console.error('❌ Error hashing password:', err)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

run()

