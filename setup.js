#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up LocalBeat ERP System...\n');

// Check if Node.js is installed
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js ${nodeVersion} is installed`);
} catch (error) {
  console.error('❌ Node.js is not installed. Please install Node.js v16 or higher.');
  process.exit(1);
}

// Install frontend dependencies
console.log('\n📦 Installing frontend dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Frontend dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install frontend dependencies');
  process.exit(1);
}

// Install backend dependencies
console.log('\n📦 Installing backend dependencies...');
try {
  process.chdir('backend');
  execSync('npm install', { stdio: 'inherit' });
  process.chdir('..');
  console.log('✅ Backend dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install backend dependencies');
  process.exit(1);
}

// Create .env file for backend
console.log('\n⚙️  Setting up environment configuration...');
const envContent = `NODE_ENV=development
PORT=5000
MONGODB_URI= mongodb+srv://dk0133964_db_user:Pehq6BWkL0nJbpch@cluster0.ljxhwyd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
`;

try {
  fs.writeFileSync(path.join('backend', '.env'), envContent);
  console.log('✅ Environment file created');
} catch (error) {
  console.error('❌ Failed to create environment file');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Start the backend server: cd backend && npm run dev');
console.log('2. Start the frontend server: npm run dev');
console.log('3. Open http://localhost:3000 in your browser');
console.log('\n🔐 Default login credentials:');
console.log('   Username: admin');
console.log('   Password: admin123');
console.log('\n📚 For more information, see README.md');
