/*
 * Script: Delete all users except the Admin user (deepak@gmail.com)
 * Usage: node backend/scripts/deleteUsersExceptAdmin.js
 */
const connectDB = require('../config/database')
const User = require('../models/User')

async function run() {
  try {
    await connectDB()

    console.log('\n=== DELETING USERS (EXCEPT ADMIN) ===\n')
    
    // Find the admin user first to confirm it exists
    const adminUser = await User.findOne({ email: 'deepak@gmail.com' })
    
    if (!adminUser) {
      console.log('⚠️  WARNING: Admin user (deepak@gmail.com) not found!')
      console.log('   Aborting deletion to prevent accidental deletion of admin account.')
      process.exit(1)
    }
    
    console.log(`✅ Admin user found: ${adminUser.name} (${adminUser.email})`)
    console.log('   This user will be preserved.\n')
    
    // Delete all users except the admin
    const deleteResult = await User.deleteMany({ 
      email: { $ne: 'deepak@gmail.com' } 
    })
    
    console.log(`✅ Deleted ${deleteResult.deletedCount} user(s)`)
    
    // Verify remaining users
    const remainingUsers = await User.find().select('-password').sort({ createdAt: -1 })
    console.log(`\n✅ Remaining users in database: ${remainingUsers.length}`)
    
    if (remainingUsers.length > 0) {
      console.log('\nRemaining users:')
      remainingUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`)
      })
    }
    
    console.log('\n✅ Operation completed successfully!')
  } catch (err) {
    console.error('❌ Error deleting users:', err)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

run()
