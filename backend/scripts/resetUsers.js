/*
 * Script: Reset users to the provided set (deletes all existing users)
 * Usage: node backend/scripts/resetUsers.js
 */
const connectDB = require('../config/database')
const User = require('../models/User')

async function createUser({ name, email, password, role = 'Staff', isAdmin = false, assignedOutletCode = '' }) {
  // Note: Auth route currently uses plain-text comparison.
  // Store passwords as plain text to match existing login behavior.
  // If you later switch auth to bcrypt, update this script accordingly.
  return {
    name,
    email: String(email).toLowerCase(),
    password: String(password),
    role,
    isAdmin,
    status: 'Active',
    assignedOutletCode,
  }
}

async function run() {
  try {
    await connectDB()

    console.log('⚠️  Deleting ALL existing users...')
    await User.deleteMany({})
    console.log('✅ Existing users removed')

    const users = []
    users.push(await createUser({
      name: 'Vibes Complex Manager',
      email: 'thelocalbeet@big-kwt.com',
      password: '52442',
      role: 'Manager',
      assignedOutletCode: 'VIBE_COMPLEX'
    }))
    users.push(await createUser({
      name: 'Kuwait City Manager',
      email: 'thelocalbeetwip@big-kwt.com',
      password: '12345',
      role: 'Manager',
      assignedOutletCode: 'KUWAIT_CITY'
    }))
    users.push(await createUser({
      name: '360 Mall Manager',
      email: 'thelocalbeet360@big-kwt.com',
      password: '45355',
      role: 'Manager',
      assignedOutletCode: 'MALL_360'
    }))
    users.push(await createUser({
      name: 'Admin',
      email: 'deepak@gmail.com',
      password: '2434325',
      role: 'Admin',
      isAdmin: true,
      assignedOutletCode: ''
    }))

    await User.insertMany(users)
    console.log(`✅ Inserted ${users.length} users`)
  } catch (err) {
    console.error('❌ Error resetting users:', err)
  } finally {
    process.exit(0)
  }
}

run()


