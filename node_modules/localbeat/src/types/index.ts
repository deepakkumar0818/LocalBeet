// Base interfaces
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Raw Material Master
export interface RawMaterial extends BaseEntity {
  materialCode: string;
  materialName: string;
  description: string;
  category: string;
  unitOfMeasure: string;
  unitPrice: number;
  minimumStock: number;
  maximumStock: number;
  currentStock: number;
  supplierId?: string;
  specifications?: Record<string, any>;
  isActive: boolean;
}

// Bill of Materials (BOM)
export interface BOMItem {
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unitOfMeasure: string;
  unitCost: number;
  totalCost: number;
}

export interface BillOfMaterials extends BaseEntity {
  bomCode: string;
  productName: string;
  productDescription: string;
  version: string;
  effectiveDate: Date;
  expiryDate?: Date;
  status: 'Draft' | 'Active' | 'Obsolete';
  totalCost: number;
  items: BOMItem[];
}

// Job Order
export interface JobOrderItem {
  bomId?: string;
  bomCode?: string;
  product: string;
  outletA: number;
  outletB: number;
  outletC: number;
  totalQuantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface JobOrder extends BaseEntity {
  jobOrderNumber: string;
  customerId: string;
  customerName: string;
  orderDate: Date;
  deliveryDate: Date;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  totalAmount: number;
  items: JobOrderItem[];
  notes?: string;
}

// Purchase Order
export interface PurchaseOrderItem {
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity?: number;
}

export interface PurchaseOrder extends BaseEntity {
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: Date;
  expectedDeliveryDate: Date;
  status: 'Draft' | 'Sent' | 'Confirmed' | 'Partial' | 'Completed' | 'Cancelled';
  totalAmount: number;
  items: PurchaseOrderItem[];
  terms?: string;
  notes?: string;
}

// Good Receipt Note (GRN)
export interface GRNItem {
  poItemId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice: number;
  qualityStatus: 'Accepted' | 'Rejected' | 'Partial';
  remarks?: string;
}

export interface GoodReceiptNote extends BaseEntity {
  grnNumber: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  receiptDate: Date;
  status: 'Draft' | 'Approved' | 'Rejected';
  totalAmount: number;
  items: GRNItem[];
  warehouseId: string;
  warehouseName: string;
  receivedBy: string;
  notes?: string;
}

// Warehouse Master
export interface Warehouse extends BaseEntity {
  warehouseCode: string;
  warehouseName: string;
  description: string;
  address: Address;
  capacity: number;
  currentCapacity: number;
  managerId: string;
  managerName: string;
  isActive: boolean;
  storageTypes: string[];
}

// Store Issue Voucher
export interface StoreIssueItem {
  materialId: string;
  materialCode: string;
  materialName: string;
  requestedQuantity: number;
  issuedQuantity: number;
  unitPrice: number;
  totalPrice: number;
  remarks?: string;
}

export interface StoreIssueVoucher extends BaseEntity {
  voucherNumber: string;
  jobOrderId?: string;
  jobOrderNumber?: string;
  department: string;
  issuedTo: string;
  issuedBy: string;
  issueDate: Date;
  status: 'Draft' | 'Approved' | 'Issued' | 'Cancelled';
  totalAmount: number;
  items: StoreIssueItem[];
  warehouseId: string;
  warehouseName: string;
  purpose: string;
  notes?: string;
}

// Transfer Order
export interface TransferOrderItem {
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  totalPrice: number;
  remarks?: string;
}

export interface TransferOrder extends BaseEntity {
  transferNumber: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  transferDate: Date;
  expectedDeliveryDate?: Date;
  status: 'Draft' | 'Approved' | 'In Transit' | 'Delivered' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  totalAmount: number;
  items: TransferOrderItem[];
  requestedBy: string;
  approvedBy?: string;
  receivedBy?: string;
  transferType: 'Internal' | 'External' | 'Emergency';
  reason: string;
  notes?: string;
}

// Supplier
export interface Supplier extends BaseEntity {
  supplierCode: string;
  supplierName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: Address;
  paymentTerms: string;
  creditLimit: number;
  isActive: boolean;
}

// Customer
export interface Customer extends BaseEntity {
  customerCode: string;
  customerName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: Address;
  creditLimit: number;
  paymentTerms: string;
  isActive: boolean;
}

// User
export interface User extends BaseEntity {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Manager' | 'Operator' | 'Viewer';
  department: string;
  isActive: boolean;
}

// Dashboard Data
export interface DashboardStats {
  totalJobOrders: number;
  pendingJobOrders: number;
  completedJobOrders: number;
  totalPurchaseOrders: number;
  pendingPurchaseOrders: number;
  totalRawMaterials: number;
  lowStockMaterials: number;
  totalWarehouses: number;
  activeWarehouses: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Inventory Management
export interface InventoryItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  warehouseId: string;
  warehouseName: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  unitOfMeasure: string;
  unitPrice: number;
  totalValue: number;
  lastUpdated: Date;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstock';
  location?: string;
  batchNumber?: string;
  expiryDate?: Date;
  supplier?: string;
  notes?: string;
}

export interface StockMovement {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  warehouseId: string;
  warehouseName: string;
  movementType: 'In' | 'Out' | 'Transfer' | 'Adjustment';
  movementReason: 'Purchase' | 'Sale' | 'Production' | 'Transfer' | 'Adjustment' | 'Return' | 'Damage' | 'Expiry';
  quantity: number;
  unitPrice: number;
  totalValue: number;
  referenceNumber?: string;
  referenceType?: 'Purchase Order' | 'Sales Order' | 'Transfer Order' | 'Production Order' | 'Adjustment';
  movementDate: Date;
  performedBy: string;
  notes?: string;
  batchNumber?: string;
  expiryDate?: Date;
}

export interface InventoryReport {
  id: string;
  reportType: 'Stock Summary' | 'Stock Movement' | 'Low Stock Alert' | 'Value Report' | 'ABC Analysis';
  generatedDate: Date;
  generatedBy: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  filters?: {
    warehouseId?: string;
    materialCategory?: string;
    status?: string;
  };
  data: any;
  summary: {
    totalItems: number;
    totalValue: number;
    totalMovements: number;
    lowStockItems: number;
  };
}

// Raw Material Forecast Item
export interface ForecastItem {
  materialId: string;
  materialCode: string;
  materialName: string;
  currentStock: number;
  unitOfMeasure: string;
  unitPrice: number;
  forecastQuantity: number;
  forecastValue: number;
  leadTime: number; // in days
  supplierId?: string;
  supplierName?: string;
  notes?: string;
  // Quantity Analysis
  requiredQuantity: number;
  availableQuantity: number;
  shortfall: number;
  // Job Order Reference
  jobOrderId?: string;
  jobOrderNumber?: string;
  bomId?: string;
  bomCode?: string;
}

// Raw Material Forecast
export interface RawMaterialForecast extends BaseEntity {
  forecastNumber: string;
  forecastName: string;
  forecastDescription?: string;
  forecastPeriod: 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  forecastStartDate: Date;
  forecastEndDate: Date;
  status: 'Draft' | 'Active' | 'Completed' | 'Cancelled';
  totalValue: number;
  items: ForecastItem[];
  basedOnJobOrders: boolean;
  basedOnHistoricalData: boolean;
  confidenceLevel: 'Low' | 'Medium' | 'High';
  createdBy: string;
  updatedBy: string;
}
