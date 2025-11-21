import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedOutletRoute from './components/ProtectedOutletRoute'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import RawMaterials from './pages/RawMaterials'
import AddMaterial from './pages/AddMaterial'
import EditMaterial from './pages/EditMaterial'
import BillOfMaterials from './pages/BillOfMaterials'
import AddBOM from './pages/AddBOM'
import EditBOM from './pages/EditBOM'
import AddFinishedGood from './pages/AddFinishedGood'
import JobOrders from './pages/JobOrders'
import AddJobOrder from './pages/AddJobOrder'
import EditJobOrder from './pages/EditJobOrder'
import PurchaseOrders from './pages/PurchaseOrders'
import AddPurchaseOrder from './pages/AddPurchaseOrder'
import EditPurchaseOrder from './pages/EditPurchaseOrder'
import GoodReceiptNotes from './pages/GoodReceiptNotes'
import AddGRN from './pages/AddGRN'
import EditGRN from './pages/EditGRN'
import WarehouseMaster from './pages/WarehouseMaster'
import AddWarehouse from './pages/AddWarehouse'
import EditWarehouse from './pages/EditWarehouse'
import TransferOrders from './pages/TransferOrders'
import EditTransferOrder from './pages/EditTransferOrder'
// import Inventory from './pages/Inventory'
import OutletMaster from './pages/OutletMaster'
import AddOutlet from './pages/AddOutlet'
import EditOutlet from './pages/EditOutlet'
import CentralKitchen from './pages/CentralKitchen'
import CentralKitchenRawMaterials from './pages/CentralKitchenRawMaterials'
import CentralKitchenFinishedGoods from './pages/CentralKitchenFinishedGoods'
import CentralKitchenMakeFinishedGood from './pages/CentralKitchenMakeFinishedGood'
import CentralKitchenCreateTransfer from './pages/CentralKitchenCreateTransfer'
import DowntownRestaurant from './pages/DowntownRestaurant'
import MarinaWalkCafe from './pages/MarinaWalkCafe'
import MallFoodCourt from './pages/MallFoodCourt'
import DriveThruExpress from './pages/DriveThruExpress'
import RawMaterialForecast from './pages/RawMaterialForecast'
import AddForecast from './pages/AddForecast'
import SalesOrders from './pages/SalesOrders'
import AddSalesOrder from './pages/AddSalesOrder'
import POSCreateOrder from './pages/POSCreateOrder'
import Settings from './pages/Settings'
import ItemsList from './pages/ItemsList'
import LocationsList from './pages/LocationsList'
import KuwaitCityRequestRawMaterials from './pages/KuwaitCityRequestRawMaterials'
import KuwaitCityRequestFinishedGoods from './pages/KuwaitCityRequestFinishedGoods'
import Mall360RequestRawMaterials from './pages/Mall360RequestRawMaterials'
import Mall360RequestFinishedGoods from './pages/Mall360RequestFinishedGoods'
import VibesComplexRequestRawMaterials from './pages/VibesComplexRequestRawMaterials'
import VibesComplexRequestFinishedGoods from './pages/VibesComplexRequestFinishedGoods'
import TaibaHospitalRequestRawMaterials from './pages/TaibaHospitalRequestRawMaterials'
import TaibaHospitalRequestFinishedGoods from './pages/TaibaHospitalRequestFinishedGoods'

function App() {
  const location = useLocation()
  const isAuthRoute = location.pathname === '/login'
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const authUser = typeof window !== 'undefined' ? (() => { try { return JSON.parse(localStorage.getItem('auth_user') || 'null') } catch { return null } })() : null
  const isAdmin = Boolean(authUser?.isAdmin)

  if (isAuthRoute) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    )
  }

  if (!token) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/raw-materials" element={<RawMaterials />} />
        <Route path="/raw-materials/add" element={<AddMaterial />} />
        <Route path="/raw-materials/edit/:id" element={<EditMaterial />} />
        <Route path="/bill-of-materials" element={<BillOfMaterials />} />
        <Route path="/bill-of-materials/add" element={<AddBOM />} />
        <Route path="/bill-of-materials/edit/:id" element={<EditBOM />} />
        <Route path="/finished-goods/add" element={<AddFinishedGood />} />
        <Route path="/job-orders" element={<JobOrders />} />
        <Route path="/job-orders/add" element={<AddJobOrder />} />
        <Route path="/job-orders/edit/:id" element={<EditJobOrder />} />
        <Route path="/purchase-orders" element={<PurchaseOrders />} />
        <Route path="/purchase-orders/add" element={<AddPurchaseOrder />} />
        <Route path="/purchase-orders/edit/:id" element={<EditPurchaseOrder />} />
        <Route path="/items-list" element={<ItemsList />} />
        
        <Route path="/locations-list" element={<LocationsList />} />
        
        <Route path="/good-receipt-notes" element={<GoodReceiptNotes />} />
        <Route path="/good-receipt-notes/add" element={<AddGRN />} />
        <Route path="/good-receipt-notes/edit/:id" element={<EditGRN />} />
        <Route path="/warehouse-master" element={<WarehouseMaster />} />
        <Route path="/warehouse-master/add" element={<AddWarehouse />} />
        <Route path="/warehouse-master/edit/:id" element={<EditWarehouse />} />
        <Route path="/transfer-orders" element={<TransferOrders />} />
        <Route path="/transfer-orders/edit/:id" element={<EditTransferOrder />} />
        {/* <Route path="/inventory" element={<Inventory />} /> */}
        <Route path="/outlets" element={<OutletMaster />} />
        <Route path="/outlets/add" element={<AddOutlet />} />
        <Route path="/outlets/edit/:id" element={<EditOutlet />} />
        {/* Central Kitchen routes - Admin only */}
        {isAdmin && (
          <>
            <Route path="/central-kitchen" element={<CentralKitchen />} />
            <Route path="/central-kitchen/raw-materials" element={<CentralKitchenRawMaterials />} />
            <Route path="/central-kitchen/finished-goods" element={<CentralKitchenFinishedGoods />} />
            <Route path="/central-kitchen/make-finished-good" element={<CentralKitchenMakeFinishedGood />} />
            <Route path="/central-kitchen/create-transfer" element={<CentralKitchenCreateTransfer />} />
          </>
        )}
        <Route path="/kuwait-city" element={<ProtectedOutletRoute allowedOutletCodes={['KUWAIT_CITY']}><DowntownRestaurant /></ProtectedOutletRoute>} />
        <Route path="/kuwait-city/raw-materials" element={<ProtectedOutletRoute allowedOutletCodes={['KUWAIT_CITY']}><DowntownRestaurant /></ProtectedOutletRoute>} />
        <Route path="/kuwait-city/finished-goods" element={<ProtectedOutletRoute allowedOutletCodes={['KUWAIT_CITY']}><DowntownRestaurant /></ProtectedOutletRoute>} />
        <Route path="/kuwait-city/request-raw-materials" element={<ProtectedOutletRoute allowedOutletCodes={['KUWAIT_CITY']}><KuwaitCityRequestRawMaterials /></ProtectedOutletRoute>} />
        <Route path="/kuwait-city/request-finished-goods" element={<ProtectedOutletRoute allowedOutletCodes={['KUWAIT_CITY']}><KuwaitCityRequestFinishedGoods /></ProtectedOutletRoute>} />
        <Route path="/360-mall" element={<ProtectedOutletRoute allowedOutletCodes={['MALL_360']}><MallFoodCourt /></ProtectedOutletRoute>} />
        <Route path="/360-mall/raw-materials" element={<ProtectedOutletRoute allowedOutletCodes={['MALL_360']}><MallFoodCourt /></ProtectedOutletRoute>} />
        <Route path="/360-mall/finished-goods" element={<ProtectedOutletRoute allowedOutletCodes={['MALL_360']}><MallFoodCourt /></ProtectedOutletRoute>} />
        <Route path="/360-mall/request-raw-materials" element={<ProtectedOutletRoute allowedOutletCodes={['MALL_360']}><Mall360RequestRawMaterials /></ProtectedOutletRoute>} />
        <Route path="/360-mall/request-finished-goods" element={<ProtectedOutletRoute allowedOutletCodes={['MALL_360']}><Mall360RequestFinishedGoods /></ProtectedOutletRoute>} />
        <Route path="/marina-walk-cafe" element={<ProtectedOutletRoute allowedOutletCodes={['VIBE_COMPLEX']}><MarinaWalkCafe /></ProtectedOutletRoute>} />
        <Route path="/marina-walk-cafe/raw-materials" element={<ProtectedOutletRoute allowedOutletCodes={['VIBE_COMPLEX']}><MarinaWalkCafe /></ProtectedOutletRoute>} />
        <Route path="/marina-walk-cafe/finished-goods" element={<ProtectedOutletRoute allowedOutletCodes={['VIBE_COMPLEX']}><MarinaWalkCafe /></ProtectedOutletRoute>} />
        <Route path="/marina-walk-cafe/request-raw-materials" element={<ProtectedOutletRoute allowedOutletCodes={['VIBE_COMPLEX']}><VibesComplexRequestRawMaterials /></ProtectedOutletRoute>} />
        <Route path="/marina-walk-cafe/request-finished-goods" element={<ProtectedOutletRoute allowedOutletCodes={['VIBE_COMPLEX']}><VibesComplexRequestFinishedGoods /></ProtectedOutletRoute>} />
        {/* Vibes Complex routes */}
        <Route path="/vibes-complex" element={<ProtectedOutletRoute allowedOutletCodes={['VIBE_COMPLEX']}><MarinaWalkCafe /></ProtectedOutletRoute>} />
        <Route path="/vibes-complex/raw-materials" element={<ProtectedOutletRoute allowedOutletCodes={['VIBE_COMPLEX']}><MarinaWalkCafe /></ProtectedOutletRoute>} />
        <Route path="/vibes-complex/finished-goods" element={<ProtectedOutletRoute allowedOutletCodes={['VIBE_COMPLEX']}><MarinaWalkCafe /></ProtectedOutletRoute>} />
        <Route path="/vibes-complex/request-raw-materials" element={<ProtectedOutletRoute allowedOutletCodes={['VIBE_COMPLEX']}><VibesComplexRequestRawMaterials /></ProtectedOutletRoute>} />
        <Route path="/vibes-complex/request-finished-goods" element={<ProtectedOutletRoute allowedOutletCodes={['VIBE_COMPLEX']}><VibesComplexRequestFinishedGoods /></ProtectedOutletRoute>} />
        {/* Back-compat old drive-thru paths still render Taiba component */}
        <Route path="/drive-thru-express" element={<ProtectedOutletRoute allowedOutletCodes={['TAIBA_HOSPITAL']}><DriveThruExpress /></ProtectedOutletRoute>} />
        <Route path="/drive-thru-express/raw-materials" element={<ProtectedOutletRoute allowedOutletCodes={['TAIBA_HOSPITAL']}><DriveThruExpress /></ProtectedOutletRoute>} />
        <Route path="/drive-thru-express/finished-goods" element={<ProtectedOutletRoute allowedOutletCodes={['TAIBA_HOSPITAL']}><DriveThruExpress /></ProtectedOutletRoute>} />
        <Route path="/drive-thru-express/request-raw-materials" element={<ProtectedOutletRoute allowedOutletCodes={['TAIBA_HOSPITAL']}><TaibaHospitalRequestRawMaterials /></ProtectedOutletRoute>} />
        <Route path="/drive-thru-express/request-finished-goods" element={<ProtectedOutletRoute allowedOutletCodes={['TAIBA_HOSPITAL']}><TaibaHospitalRequestFinishedGoods /></ProtectedOutletRoute>} />
        {/* Primary Taiba Hospital routes */}
        <Route path="/taiba-hospital" element={<ProtectedOutletRoute allowedOutletCodes={['TAIBA_HOSPITAL']}><DriveThruExpress /></ProtectedOutletRoute>} />
        <Route path="/taiba-hospital/raw-materials" element={<ProtectedOutletRoute allowedOutletCodes={['TAIBA_HOSPITAL']}><DriveThruExpress /></ProtectedOutletRoute>} />
        <Route path="/taiba-hospital/finished-goods" element={<ProtectedOutletRoute allowedOutletCodes={['TAIBA_HOSPITAL']}><DriveThruExpress /></ProtectedOutletRoute>} />
        <Route path="/taiba-hospital/request-raw-materials" element={<ProtectedOutletRoute allowedOutletCodes={['TAIBA_HOSPITAL']}><TaibaHospitalRequestRawMaterials /></ProtectedOutletRoute>} />
        <Route path="/taiba-hospital/request-finished-goods" element={<ProtectedOutletRoute allowedOutletCodes={['TAIBA_HOSPITAL']}><TaibaHospitalRequestFinishedGoods /></ProtectedOutletRoute>} />
        <Route path="/raw-material-forecast" element={<RawMaterialForecast />} />
        <Route path="/raw-material-forecast/add" element={<AddForecast />} />
        <Route path="/sales-orders" element={<SalesOrders />} />
        <Route path="/sales-orders/add" element={<AddSalesOrder />} />
        <Route path="/kuwait-city/sales-orders" element={<ProtectedOutletRoute allowedOutletCodes={['KUWAIT_CITY']}><SalesOrders /></ProtectedOutletRoute>} />
        <Route path="/kuwait-city/sales-orders/add" element={<ProtectedOutletRoute allowedOutletCodes={['KUWAIT_CITY']}><AddSalesOrder /></ProtectedOutletRoute>} />
        {/* TEMPORARY: Kuwait City POS sales disabled - uncomment when needed */}
        {/* <Route path="/kuwait-city/pos-sales/create-order" element={<ProtectedOutletRoute allowedOutletCodes={['KUWAIT_CITY']}><POSCreateOrder /></ProtectedOutletRoute>} /> */}
        <Route path="/marina-walk-cafe/sales-orders" element={<ProtectedOutletRoute allowedOutletCodes={['VIBE_COMPLEX']}><SalesOrders /></ProtectedOutletRoute>} />
        <Route path="/marina-walk-cafe/sales-orders/add" element={<ProtectedOutletRoute allowedOutletCodes={['VIBE_COMPLEX']}><AddSalesOrder /></ProtectedOutletRoute>} />
        <Route path="/marina-walk-cafe/pos-sales/create-order" element={<ProtectedOutletRoute allowedOutletCodes={['VIBE_COMPLEX']}><POSCreateOrder /></ProtectedOutletRoute>} />
        <Route path="/360-mall/sales-orders" element={<ProtectedOutletRoute allowedOutletCodes={['MALL_360']}><SalesOrders /></ProtectedOutletRoute>} />
        <Route path="/360-mall/sales-orders/add" element={<ProtectedOutletRoute allowedOutletCodes={['MALL_360']}><AddSalesOrder /></ProtectedOutletRoute>} />
        <Route path="/360-mall/pos-sales/create-order" element={<ProtectedOutletRoute allowedOutletCodes={['MALL_360']}><POSCreateOrder /></ProtectedOutletRoute>} />
        <Route path="/mall-food-court/sales-orders" element={<ProtectedOutletRoute allowedOutletCodes={['MALL_360']}><SalesOrders /></ProtectedOutletRoute>} />
        <Route path="/mall-food-court/sales-orders/add" element={<ProtectedOutletRoute allowedOutletCodes={['MALL_360']}><AddSalesOrder /></ProtectedOutletRoute>} />
        <Route path="/mall-food-court/pos-sales/create-order" element={<ProtectedOutletRoute allowedOutletCodes={['MALL_360']}><POSCreateOrder /></ProtectedOutletRoute>} />
        <Route path="/vibes-complex/sales-orders" element={<ProtectedOutletRoute allowedOutletCodes={['VIBE_COMPLEX']}><SalesOrders /></ProtectedOutletRoute>} />
        <Route path="/vibes-complex/sales-orders/add" element={<ProtectedOutletRoute allowedOutletCodes={['VIBE_COMPLEX']}><AddSalesOrder /></ProtectedOutletRoute>} />
        <Route path="/vibes-complex/pos-sales/create-order" element={<ProtectedOutletRoute allowedOutletCodes={['VIBE_COMPLEX']}><POSCreateOrder /></ProtectedOutletRoute>} />
        <Route path="/drive-thru-express/sales-orders" element={<ProtectedOutletRoute allowedOutletCodes={['TAIBA_HOSPITAL']}><SalesOrders /></ProtectedOutletRoute>} />
        <Route path="/drive-thru-express/sales-orders/add" element={<ProtectedOutletRoute allowedOutletCodes={['TAIBA_HOSPITAL']}><AddSalesOrder /></ProtectedOutletRoute>} />
        <Route path="/drive-thru-express/pos-sales/create-order" element={<ProtectedOutletRoute allowedOutletCodes={['TAIBA_HOSPITAL']}><POSCreateOrder /></ProtectedOutletRoute>} />
        <Route path="/taiba-hospital/sales-orders" element={<ProtectedOutletRoute allowedOutletCodes={['TAIBA_HOSPITAL']}><SalesOrders /></ProtectedOutletRoute>} />
        <Route path="/taiba-hospital/sales-orders/add" element={<ProtectedOutletRoute allowedOutletCodes={['TAIBA_HOSPITAL']}><AddSalesOrder /></ProtectedOutletRoute>} />
        <Route path="/taiba-hospital/pos-sales/create-order" element={<ProtectedOutletRoute allowedOutletCodes={['TAIBA_HOSPITAL']}><POSCreateOrder /></ProtectedOutletRoute>} />
        {isAdmin ? (
          <Route path="/settings" element={<Settings />} />
        ) : (
          <Route path="/settings" element={<Navigate to="/dashboard" replace />} />
        )}
      </Routes>
    </Layout>
  )
}

export default App
