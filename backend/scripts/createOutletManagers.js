/*
 * Script: Create outlet managers for all 4 outlets
 * Usage: node backend/scripts/createOutletManagers.js
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
    await connectDB()

    console.log('Creating outlet managers...')

    const managers = [
      {
        name: 'Vibes Complex Manager',
        email: 'thelocalbeet@big-kwt.com',
        password: '52442',
        role: 'Manager',
        assignedOutletCode: 'VIBE_COMPLEX'
      },
      {
        name: 'Kuwait City Manager',
        email: 'thelocalbeetwip@big-kwt.com',
        password: '12345',
        role: 'Manager',
        assignedOutletCode: 'KUWAIT_CITY'
      },
      {
        name: '360 Mall Manager',
        email: 'thelocalbeet360@big-kwt.com',
        password: '45355',
        role: 'Manager',
        assignedOutletCode: 'MALL_360'
      },
      {
        name: 'Taiba Hospital Manager',
        email: 'MRizvi@thedailybeet.com.kw',
        password: '53451144',
        role: 'Manager',
        assignedOutletCode: 'TAIBA_HOSPITAL'
      }
    ]

    for (const managerData of managers) {
      const existingUser = await User.findOne({ email: managerData.email.toLowerCase() })
      
      if (existingUser) {
        // Update existing user
        const hashedPassword = await bcrypt.hash(String(managerData.password), 10)
        await User.updateOne(
          { email: managerData.email.toLowerCase() },
          {
            $set: {
              name: managerData.name,
              password: hashedPassword,
              role: managerData.role,
              isAdmin: false,
              status: 'Active',
              assignedOutletCode: managerData.assignedOutletCode
            }
          }
        )
        console.log(`✅ Updated user: ${managerData.email}`)
      } else {
        // Create new user
        const user = await createUser(managerData)
        await User.create(user)
        console.log(`✅ Created user: ${managerData.email}`)
      }
    }

    console.log('✅ All outlet managers created/updated successfully')
  } catch (err) {
    console.error('❌ Error creating outlet managers:', err)
  } finally {
    process.exit(0)
  }
}

run()

