import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import RawMaterials from './pages/RawMaterials'
import AddMaterial from './pages/AddMaterial'
import EditMaterial from './pages/EditMaterial'
import BillOfMaterials from './pages/BillOfMaterials'
import AddBOM from './pages/AddBOM'
import EditBOM from './pages/EditBOM'
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
import Inventory from './pages/Inventory'
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
import KuwaitCityRequestRawMaterials from './pages/KuwaitCityRequestRawMaterials'
import KuwaitCityRequestFinishedGoods from './pages/KuwaitCityRequestFinishedGoods'
import Mall360RequestRawMaterials from './pages/Mall360RequestRawMaterials'
import Mall360RequestFinishedGoods from './pages/Mall360RequestFinishedGoods'
import VibesComplexRequestRawMaterials from './pages/VibesComplexRequestRawMaterials'
import VibesComplexRequestFinishedGoods from './pages/VibesComplexRequestFinishedGoods'
import TaibaHospitalRequestRawMaterials from './pages/TaibaHospitalRequestRawMaterials'
import TaibaHospitalRequestFinishedGoods from './pages/TaibaHospitalRequestFinishedGoods'

function App() {
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
        <Route path="/job-orders" element={<JobOrders />} />
        <Route path="/job-orders/add" element={<AddJobOrder />} />
        <Route path="/job-orders/edit/:id" element={<EditJobOrder />} />
        <Route path="/purchase-orders" element={<PurchaseOrders />} />
        <Route path="/purchase-orders/add" element={<AddPurchaseOrder />} />
        <Route path="/purchase-orders/edit/:id" element={<EditPurchaseOrder />} />
        <Route path="/good-receipt-notes" element={<GoodReceiptNotes />} />
        <Route path="/good-receipt-notes/add" element={<AddGRN />} />
        <Route path="/good-receipt-notes/edit/:id" element={<EditGRN />} />
        <Route path="/warehouse-master" element={<WarehouseMaster />} />
        <Route path="/warehouse-master/add" element={<AddWarehouse />} />
        <Route path="/warehouse-master/edit/:id" element={<EditWarehouse />} />
        <Route path="/transfer-orders" element={<TransferOrders />} />
        <Route path="/transfer-orders/edit/:id" element={<EditTransferOrder />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/outlets" element={<OutletMaster />} />
        <Route path="/outlets/add" element={<AddOutlet />} />
        <Route path="/outlets/edit/:id" element={<EditOutlet />} />
        <Route path="/central-kitchen" element={<CentralKitchen />} />
        <Route path="/central-kitchen/raw-materials" element={<CentralKitchenRawMaterials />} />
        <Route path="/central-kitchen/finished-goods" element={<CentralKitchenFinishedGoods />} />
        <Route path="/central-kitchen/make-finished-good" element={<CentralKitchenMakeFinishedGood />} />
        <Route path="/central-kitchen/create-transfer" element={<CentralKitchenCreateTransfer />} />
        <Route path="/kuwait-city" element={<DowntownRestaurant />} />
        <Route path="/kuwait-city/raw-materials" element={<DowntownRestaurant />} />
        <Route path="/kuwait-city/finished-goods" element={<DowntownRestaurant />} />
        <Route path="/kuwait-city/request-raw-materials" element={<KuwaitCityRequestRawMaterials />} />
        <Route path="/kuwait-city/request-finished-goods" element={<KuwaitCityRequestFinishedGoods />} />
        <Route path="/360-mall" element={<MallFoodCourt />} />
        <Route path="/360-mall/raw-materials" element={<MallFoodCourt />} />
        <Route path="/360-mall/finished-goods" element={<MallFoodCourt />} />
        <Route path="/360-mall/request-raw-materials" element={<Mall360RequestRawMaterials />} />
        <Route path="/360-mall/request-finished-goods" element={<Mall360RequestFinishedGoods />} />
        <Route path="/marina-walk-cafe" element={<MarinaWalkCafe />} />
        <Route path="/marina-walk-cafe/raw-materials" element={<MarinaWalkCafe />} />
        <Route path="/marina-walk-cafe/finished-goods" element={<MarinaWalkCafe />} />
        <Route path="/marina-walk-cafe/request-raw-materials" element={<VibesComplexRequestRawMaterials />} />
        <Route path="/marina-walk-cafe/request-finished-goods" element={<VibesComplexRequestFinishedGoods />} />
        <Route path="/mall-food-court" element={<MallFoodCourt />} />
        <Route path="/360-mall/raw-materials" element={<MallFoodCourt />} />
        <Route path="/360-mall/finished-goods" element={<MallFoodCourt />} />
        <Route path="/360-mall/request-raw-materials" element={<Mall360RequestRawMaterials />} />
        <Route path="/360-mall/request-finished-goods" element={<Mall360RequestFinishedGoods />} />
        <Route path="/mall-food-court/raw-materials" element={<MallFoodCourt />} />
        <Route path="/mall-food-court/finished-goods" element={<MallFoodCourt />} />
        <Route path="/mall-food-court/request-raw-materials" element={<Mall360RequestRawMaterials />} />
        <Route path="/mall-food-court/request-finished-goods" element={<Mall360RequestFinishedGoods />} />
        {/* Vibes Complex routes */}
        <Route path="/vibes-complex" element={<MarinaWalkCafe />} />
        <Route path="/vibes-complex/raw-materials" element={<MarinaWalkCafe />} />
        <Route path="/vibes-complex/finished-goods" element={<MarinaWalkCafe />} />
        <Route path="/vibes-complex/request-raw-materials" element={<VibesComplexRequestRawMaterials />} />
        <Route path="/vibes-complex/request-finished-goods" element={<VibesComplexRequestFinishedGoods />} />
        {/* Back-compat old drive-thru paths still render Taiba component */}
        <Route path="/drive-thru-express" element={<DriveThruExpress />} />
        <Route path="/drive-thru-express/raw-materials" element={<DriveThruExpress />} />
        <Route path="/drive-thru-express/finished-goods" element={<DriveThruExpress />} />
        <Route path="/drive-thru-express/request-raw-materials" element={<TaibaHospitalRequestRawMaterials />} />
        <Route path="/drive-thru-express/request-finished-goods" element={<TaibaHospitalRequestFinishedGoods />} />
        {/* Primary Taiba Hospital routes */}
        <Route path="/taiba-hospital" element={<DriveThruExpress />} />
        <Route path="/taiba-hospital/raw-materials" element={<DriveThruExpress />} />
        <Route path="/taiba-hospital/finished-goods" element={<DriveThruExpress />} />
        <Route path="/taiba-hospital/request-raw-materials" element={<TaibaHospitalRequestRawMaterials />} />
        <Route path="/taiba-hospital/request-finished-goods" element={<TaibaHospitalRequestFinishedGoods />} />
        <Route path="/raw-material-forecast" element={<RawMaterialForecast />} />
        <Route path="/raw-material-forecast/add" element={<AddForecast />} />
        <Route path="/sales-orders" element={<SalesOrders />} />
        <Route path="/sales-orders/add" element={<AddSalesOrder />} />
        <Route path="/kuwait-city/sales-orders" element={<SalesOrders />} />
        <Route path="/kuwait-city/sales-orders/add" element={<AddSalesOrder />} />
        <Route path="/kuwait-city/pos-sales/create-order" element={<POSCreateOrder />} />
        <Route path="/marina-walk-cafe/sales-orders" element={<SalesOrders />} />
        <Route path="/marina-walk-cafe/sales-orders/add" element={<AddSalesOrder />} />
        <Route path="/marina-walk-cafe/pos-sales/create-order" element={<POSCreateOrder />} />
        <Route path="/360-mall/sales-orders" element={<SalesOrders />} />
        <Route path="/360-mall/sales-orders/add" element={<AddSalesOrder />} />
        <Route path="/360-mall/pos-sales/create-order" element={<POSCreateOrder />} />
        <Route path="/mall-food-court/sales-orders" element={<SalesOrders />} />
        <Route path="/mall-food-court/sales-orders/add" element={<AddSalesOrder />} />
        <Route path="/mall-food-court/pos-sales/create-order" element={<POSCreateOrder />} />
        <Route path="/vibes-complex/sales-orders" element={<SalesOrders />} />
        <Route path="/vibes-complex/sales-orders/add" element={<AddSalesOrder />} />
        <Route path="/vibes-complex/pos-sales/create-order" element={<POSCreateOrder />} />
        <Route path="/drive-thru-express/sales-orders" element={<SalesOrders />} />
        <Route path="/drive-thru-express/sales-orders/add" element={<AddSalesOrder />} />
        <Route path="/drive-thru-express/pos-sales/create-order" element={<POSCreateOrder />} />
        <Route path="/taiba-hospital/sales-orders" element={<SalesOrders />} />
        <Route path="/taiba-hospital/sales-orders/add" element={<AddSalesOrder />} />
        <Route path="/taiba-hospital/pos-sales/create-order" element={<POSCreateOrder />} />
        <Route path="/taiba-hospital/sales-orders" element={<SalesOrders />} />
        <Route path="/taiba-hospital/sales-orders/add" element={<AddSalesOrder />} />
        <Route path="/taiba-hospital/pos-sales/create-order" element={<POSCreateOrder />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default App
