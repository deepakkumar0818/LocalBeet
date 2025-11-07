/*
 * Script: Update outlet manager emails
 * Usage: node backend/scripts/updateManagerEmails.js
 */
const connectDB = require('../config/database')
const User = require('../models/User')

async function run() {
  try {
    await connectDB()

    const updates = [
      { assignedOutletCode: 'VIBE_COMPLEX', email: 'thelocalbeet@big-kwt.com' },
      { assignedOutletCode: 'KUWAIT_CITY', email: 'thelocalbeetwip@big-kwt.com' },
      { assignedOutletCode: 'MALL_360', email: 'thelocalbeet360@big-kwt.com' },
    ]

    for (const { assignedOutletCode, email } of updates) {
      const query = { assignedOutletCode, role: 'Manager' }
      const update = { $set: { email: email.toLowerCase() } }

      const existingWithEmail = await User.findOne({ email: email.toLowerCase() })
      if (existingWithEmail && existingWithEmail.assignedOutletCode !== assignedOutletCode) {
        console.warn(`⚠️  Email ${email} already used by another user (id=${existingWithEmail._id}). Skipping ${assignedOutletCode}.`)
        continue
      }

      const res = await User.updateMany(query, update)
      console.log(`✅ ${assignedOutletCode}: matched=${res.matchedCount || res.n} modified=${res.modifiedCount || res.nModified}`)

      // If no manager found, try to update any active staff for that outlet as a fallback
      if ((res.matchedCount || res.n) === 0) {
        const fallbackQuery = { assignedOutletCode }
        const fallbackRes = await User.updateMany(fallbackQuery, update)
        console.log(`ℹ️  Fallback update for ${assignedOutletCode}: matched=${fallbackRes.matchedCount || fallbackRes.n} modified=${fallbackRes.modifiedCount || fallbackRes.nModified}`)
      }
    }
  } catch (err) {
    console.error('❌ Error updating manager emails:', err)
  } finally {
    process.exit(0)
  }
}

run()



