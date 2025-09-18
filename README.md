# LocalBeat - Enterprise Resource Planning System

A comprehensive ERP system built with React TypeScript frontend and Node.js Express backend, designed for manufacturing and inventory management.

## 🚀 Features

### Core Modules
- **Dashboard** - Analytics and overview with charts and KPIs
- **Raw Materials Master** - Complete inventory management
- **Bill of Materials (BOM)** - Product composition and material requirements
- **Job Orders** - Production order management
- **Purchase Orders** - Supplier procurement management
- **Good Receipt Notes (GRN)** - Incoming material receipts
- **Warehouse Master** - Storage location management
- **Transfer Orders** - Material transfers between warehouses
- **Store Issue Vouchers** - Material issue tracking

### Technical Features
- **Modern UI/UX** - Professional design with Tailwind CSS
- **TypeScript** - Full type safety and better development experience
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Real-time Updates** - Live data synchronization
- **Advanced Filtering** - Search and filter capabilities
- **Data Visualization** - Charts and analytics with Recharts
- **Form Validation** - Comprehensive input validation
- **State Management** - Context API for global state
- **RESTful API** - Clean and well-structured backend APIs

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons
- **Recharts** - Data visualization
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger
- **JWT** - JSON Web Tokens for authentication
- **MongoDB** - NoSQL database (ready for integration)

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd LocalBeat
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd backend
npm install
```

### 4. Environment Setup
Create a `.env` file in the backend directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/localbeat
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

### 5. Start the Development Servers

#### Start Backend Server
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:5000`

#### Start Frontend Server
```bash
npm run dev
```
Frontend will run on `http://localhost:3000`

## 🏗️ Project Structure

```
LocalBeat/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── Layout.tsx       # Main layout with sidebar
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx
│   │   ├── RawMaterials.tsx
│   │   ├── BillOfMaterials.tsx
│   │   ├── JobOrders.tsx
│   │   ├── PurchaseOrders.tsx
│   │   ├── GoodReceiptNotes.tsx
│   │   ├── WarehouseMaster.tsx
│   │   └── StoreIssueVoucher.tsx
│   ├── types/              # TypeScript interfaces
│   │   └── index.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # App entry point
│   └── index.css           # Global styles
├── backend/
│   ├── routes/             # API route handlers
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── rawMaterials.js
│   │   ├── billOfMaterials.js
│   │   ├── jobOrders.js
│   │   ├── purchaseOrders.js
│   │   ├── goodReceiptNotes.js
│   │   ├── warehouses.js
│   │   └── storeIssueVouchers.js
│   ├── server.js           # Express server setup
│   └── package.json
├── package.json            # Frontend dependencies
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Raw Materials
- `GET /api/raw-materials` - Get all materials
- `GET /api/raw-materials/:id` - Get single material
- `POST /api/raw-materials` - Create material
- `PUT /api/raw-materials/:id` - Update material
- `DELETE /api/raw-materials/:id` - Delete material

### Bill of Materials
- `GET /api/bill-of-materials` - Get all BOMs
- `GET /api/bill-of-materials/:id` - Get single BOM
- `POST /api/bill-of-materials` - Create BOM
- `PUT /api/bill-of-materials/:id` - Update BOM
- `DELETE /api/bill-of-materials/:id` - Delete BOM

### Job Orders
- `GET /api/job-orders` - Get all job orders
- `POST /api/job-orders` - Create job order
- `PUT /api/job-orders/:id` - Update job order
- `DELETE /api/job-orders/:id` - Delete job order

### Purchase Orders
- `GET /api/purchase-orders` - Get all purchase orders
- `POST /api/purchase-orders` - Create purchase order

### Good Receipt Notes
- `GET /api/good-receipt-notes` - Get all GRNs

### Warehouses
- `GET /api/warehouses` - Get all warehouses

### Transfer Orders
- `GET /api/transfer-orders` - Get all transfer orders
- `GET /api/transfer-orders/:id` - Get single transfer order
- `POST /api/transfer-orders` - Create transfer order
- `PUT /api/transfer-orders/:id` - Update transfer order
- `DELETE /api/transfer-orders/:id` - Delete transfer order
- `PUT /api/transfer-orders/:id/approve` - Approve transfer order
- `PUT /api/transfer-orders/:id/deliver` - Mark as delivered

### Store Issue Vouchers
- `GET /api/store-issue-vouchers` - Get all vouchers

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/order-trends` - Get order trends
- `GET /api/dashboard/material-categories` - Get material categories
- `GET /api/dashboard/recent-activities` - Get recent activities

## 🎨 UI Components

### Design System
- **Colors**: Primary blue theme with semantic colors
- **Typography**: Inter font family
- **Spacing**: Consistent spacing scale
- **Components**: Reusable button, input, card, and table components

### Key Components
- **Layout**: Responsive sidebar navigation
- **Tables**: Sortable, filterable data tables
- **Forms**: Validated form inputs with error handling
- **Modals**: Overlay dialogs for CRUD operations
- **Charts**: Interactive data visualization
- **Status Badges**: Color-coded status indicators

## 🔒 Security Features

- **CORS Protection** - Configured for specific origins
- **Helmet Security** - Security headers middleware
- **Input Validation** - Server-side validation
- **JWT Authentication** - Token-based authentication
- **Error Handling** - Secure error responses

## 📱 Responsive Design

The application is fully responsive and works on:
- **Desktop** (1200px+)
- **Tablet** (768px - 1199px)
- **Mobile** (320px - 767px)

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
npm run build
# Deploy the dist/ folder
```

### Backend Deployment (Heroku/Railway)
```bash
cd backend
# Set environment variables
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

## 🔮 Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced reporting
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Advanced user roles
- [ ] Integration with external systems
- [ ] Automated workflows
- [ ] Advanced analytics

---

**LocalBeat ERP System** - Streamlining manufacturing operations with modern technology.
#   L o c a l B e e t  
 