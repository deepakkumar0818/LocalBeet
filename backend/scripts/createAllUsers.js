/*
 * Script: Create all users (Admin + 4 Outlet Managers)
 * Usage: node backend/scripts/createAllUsers.js
 * 
 * This script creates:
 * - 1 Admin user (deepak@gmail.com)
 * - 4 Outlet Managers (one for each outlet)
 */
const connectDB = require('../config/database')
const User = require('../models/User')
const bcrypt = require('bcryptjs')

async function createUser({ name, email, password, role = 'Manager', isAdmin = false, assignedOutletCode = '' }) {
  // Hash the password before storing
  const saltRounds = 10
  const hashedPassword = await bcrypt.hash(String(password), saltRounds)
  
  return {
    name,
    email: String(email).toLowerCase(),
    password: hashedPassword,
    role,
    isAdmin,
    status: 'Active',
    assignedOutletCode,
  }
}

async function run() {
  try {
    console.log('🔗 Connecting to MongoDB...')
    await connectDB()
    console.log('✅ Connected to MongoDB')

    console.log('\n📝 Creating/updating users...\n')

    const users = [
      {
        name: 'Admin User',
        email: 'deepak@gmail.com',
        password: '2434325',
        role: 'Admin',
        isAdmin: true,
        assignedOutletCode: ''
      },
      {
        name: 'Vibes Complex Manager',
        email: 'thelocalbeet@big-kwt.com',
        password: '52442',
        role: 'Manager',
        isAdmin: false,
        assignedOutletCode: 'VIBE_COMPLEX'
      },
      {
        name: 'Kuwait City Manager',
        email: 'thelocalbeetwip@big-kwt.com',
        password: '12345',
        role: 'Manager',
        isAdmin: false,
        assignedOutletCode: 'KUWAIT_CITY'
      },
      {
        name: '360 Mall Manager',
        email: 'thelocalbeet360@big-kwt.com',
        password: '45355',
        role: 'Manager',
        isAdmin: false,
        assignedOutletCode: 'MALL_360'
      },
      {
        name: 'Taiba Hospital Manager',
        email: 'MRizvi@thedailybeet.com.kw',
        password: '53451144',
        role: 'Manager',
        isAdmin: false,
        assignedOutletCode: 'TAIBA_HOSPITAL'
      }
    ]

    let createdCount = 0
    let updatedCount = 0
    let skippedCount = 0

    for (const userData of users) {
      const emailLower = userData.email.toLowerCase()
      const existingUser = await User.findOne({ email: emailLower })
      
      if (existingUser) {
        // Update existing user
        const hashedPassword = await bcrypt.hash(String(userData.password), 10)
        await User.updateOne(
          { email: emailLower },
          {
            $set: {
              name: userData.name,
              password: hashedPassword,
              role: userData.role,
              isAdmin: userData.isAdmin,
              status: 'Active',
              assignedOutletCode: userData.assignedOutletCode
            }
          }
        )
        console.log(`✅ Updated: ${userData.email} (${userData.role})`)
        updatedCount++
      } else {
        // Create new user
        try {
          const user = await createUser(userData)
          await User.create(user)
          console.log(`✅ Created: ${userData.email} (${userData.role})`)
          createdCount++
        } catch (error) {
          if (error.code === 11000) {
            console.log(`⚠️  Skipped: ${userData.email} (duplicate email)`)
            skippedCount++
          } else {
            throw error
          }
        }
      }
    }

    console.log('\n📊 Summary:')
    console.log(`   Created: ${createdCount} users`)
    console.log(`   Updated: ${updatedCount} users`)
    console.log(`   Skipped: ${skippedCount} users`)
    console.log(`   Total: ${createdCount + updatedCount} users processed\n`)

    // Verify users were created
    const totalUsers = await User.countDocuments({})
    console.log(`✅ Total users in database: ${totalUsers}`)
    
    // List all users
    const allUsers = await User.find({}, { password: 0 }).sort({ email: 1 })
    console.log('\n👥 All users in database:')
    allUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role}${user.isAdmin ? ', Admin' : ''}${user.assignedOutletCode ? `, Outlet: ${user.assignedOutletCode}` : ''})`)
    })

    console.log('\n✅ Script completed successfully!')
  } catch (err) {
    console.error('\n❌ Error:', err.message)
    console.error(err.stack)
  } finally {
    process.exit(0)
  }
}

run()

