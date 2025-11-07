/*
 * Script: Delete all users except the specified admin
 * Usage: node backend/scripts/deleteUsersExceptAdmin.js
 */
const connectDB = require('../config/database')
const User = require('../models/User')

const ADMIN_EMAIL = 'deepak@gmail.com'

async function run() {
  try {
    await connectDB()

    // Keep the admin; delete everyone else
    const res = await User.deleteMany({ email: { $ne: ADMIN_EMAIL } })
    console.log(`✅ Deleted ${res.deletedCount || 0} users (kept ${ADMIN_EMAIL})`)

    // Ensure admin is still present and active
    const admin = await User.findOne({ email: ADMIN_EMAIL })
    if (!admin) {
      console.warn(`⚠️  Admin user ${ADMIN_EMAIL} not found. No changes made to recreate automatically.`)
    } else if (admin.status !== 'Active') {
      await User.updateOne({ _id: admin._id }, { $set: { status: 'Active', isAdmin: true, role: 'Admin' } })
      console.log('ℹ️  Ensured admin is Active and flagged as Admin.')}    
  } catch (err) {
    console.error('❌ Error deleting users:', err)
  } finally {
    process.exit(0)
  }
}

run()



