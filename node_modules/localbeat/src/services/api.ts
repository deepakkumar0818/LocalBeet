// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || https://localbeet.onrender.com/api';
const API_BASE_URL = "http://localhost:5000/api"

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',

        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Raw Materials API
  async getRawMaterials(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = `/raw-materials${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }>(endpoint);
  }

  async getRawMaterial(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/raw-materials/${id}`);
  }

  async createRawMaterial(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/raw-materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRawMaterial(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/raw-materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRawMaterial(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/raw-materials/${id}`, {
      method: 'DELETE',
    });
  }

  async getRawMaterialCategories() {
    return this.request<{
      success: boolean;
      data: string[];
    }>('/raw-materials/categories/list');
  }

  // Bill of Materials API
  async getBillOfMaterials(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/bill-of-materials${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  async getBillOfMaterial(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/bill-of-materials/${id}`);
  }

  async createBillOfMaterial(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/bill-of-materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBillOfMaterial(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/bill-of-materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBillOfMaterial(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/bill-of-materials/${id}`, {
      method: 'DELETE',
    });
  }

  async getBillOfMaterialByCode(code: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/bill-of-materials/code/${code}`);
  }

  // Job Orders
  async getJobOrders(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const url = `/job-orders${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(url);
  }

  async getJobOrder(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/job-orders/${id}`);
  }

  async createJobOrder(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/job-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateJobOrder(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/job-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteJobOrder(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/job-orders/${id}`, {
      method: 'DELETE',
    });
  }

  // Raw Material Forecasts API
  async getRawMaterialForecasts(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    forecastPeriod?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.forecastPeriod) queryParams.append('forecastPeriod', params.forecastPeriod);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const url = `/raw-material-forecasts${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(url);
  }

  async getRawMaterialForecast(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/raw-material-forecasts/${id}`);
  }

  async createRawMaterialForecast(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/raw-material-forecasts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRawMaterialForecast(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/raw-material-forecasts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRawMaterialForecast(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/raw-material-forecasts/${id}`, {
      method: 'DELETE',
    });
  }

  // Purchase Orders API
  async getPurchaseOrders(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const url = `/purchase-orders${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(url);
  }

  async getPurchaseOrder(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/purchase-orders/${id}`);
  }

  async createPurchaseOrder(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePurchaseOrder(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePurchaseOrder(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/purchase-orders/${id}`, {
      method: 'DELETE',
    });
  }

  // Outlets API
  async getOutlets(params?: {
    page?: number;
    limit?: number;
    search?: string;
    outletType?: string;
    status?: string;
    isCentralKitchen?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.outletType) queryParams.append('outletType', params.outletType);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.isCentralKitchen) queryParams.append('isCentralKitchen', params.isCentralKitchen);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/outlets${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }>(endpoint);
  }

  async getOutlet(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/outlets/${id}`);
  }

  async createOutlet(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/outlets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOutlet(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/outlets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOutlet(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/outlets/${id}`, {
      method: 'DELETE',
    });
  }


  async getRegularOutlets() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/outlets/regular/list');
  }

  // Outlet Inventory by Outlet API (for individual outlet pages)
  async getOutletInventoryByOutlet(outletId: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/outlet-inventory/outlet/${outletId}${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }>(endpoint);
  }

  // Update outlet inventory item
  async updateOutletInventoryItem(itemId: string, updateData: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/outlet-inventory/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Finished Goods API methods
  async getFinishedGoods(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    isSeasonal?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.isSeasonal !== undefined) queryParams.append('isSeasonal', params.isSeasonal.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/finished-goods${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }>(endpoint);
  }

  async getFinishedGood(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/finished-goods/${id}`);
  }

  async createFinishedGood(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/finished-goods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFinishedGood(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/finished-goods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFinishedGood(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/finished-goods/${id}`, {
      method: 'DELETE',
    });
  }

  async getFinishedGoodCategories() {
    return this.request<{
      success: boolean;
      data: string[];
    }>('/finished-goods/category/list');
  }

  async getFinishedGoodsByBOM(bomId: string) {
    return this.request<{
      success: boolean;
      data: any[];
    }>(`/finished-goods/bom/${bomId}`);
  }

  // Finished Goods Inventory API methods
  async getFinishedGoodInventory(params?: {
    page?: number;
    limit?: number;
    search?: string;
    outletId?: string;
    outletCode?: string;
    category?: string;
    status?: string;
    qualityStatus?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.outletId) queryParams.append('outletId', params.outletId);
    if (params?.outletCode) queryParams.append('outletCode', params.outletCode);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.qualityStatus) queryParams.append('qualityStatus', params.qualityStatus);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/finished-good-inventory${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }>(endpoint);
  }

  async getFinishedGoodInventoryItem(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/finished-good-inventory/${id}`);
  }

  async createFinishedGoodInventoryItem(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/finished-good-inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFinishedGoodInventoryItem(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/finished-good-inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFinishedGoodInventoryItem(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/finished-good-inventory/${id}`, {
      method: 'DELETE',
    });
  }

  async getFinishedGoodInventoryByOutlet(outletId: string, params?: {
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    qualityStatus?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.qualityStatus) queryParams.append('qualityStatus', params.qualityStatus);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/finished-good-inventory/outlet/${outletId}${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
    }>(endpoint);
  }

  async adjustFinishedGoodInventoryStock(id: string, data: {
    adjustmentType: 'increase' | 'decrease';
    quantity: number;
    reason: string;
    updatedBy?: string;
  }) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/finished-good-inventory/${id}/adjust-stock`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getFinishedGoodInventorySummary(outletId: string) {
    return this.request<{
      success: boolean;
      data: {
        totalItems: number;
        totalValue: number;
        totalStock: number;
        lowStockItems: number;
        outOfStockItems: number;
        expiredItems: number;
      };
    }>(`/finished-good-inventory/summary/${outletId}`);
  }

  // Sales Orders API methods
  async getSalesOrders(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }>(`/sales-orders${queryString}`);
  }

  async getSalesOrder(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/sales-orders/${id}`);
  }

  async createSalesOrder(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/sales-orders`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSalesOrder(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/sales-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSalesOrder(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/sales-orders/${id}`, {
      method: 'DELETE',
    });
  }

  async getSalesOrdersByOutlet(outletId: string, params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }>(`/sales-orders/outlet/${outletId}${queryString}`);
  }

  async updateSalesOrderStatus(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/sales-orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Central Kitchen API methods
  async getCentralKitchens() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/central-kitchen');
  }

  async getCentralKitchen(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/central-kitchen/${id}`);
  }

  async createCentralKitchen(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/central-kitchen', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCentralKitchen(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/central-kitchen/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCentralKitchen(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/central-kitchen/${id}`, {
      method: 'DELETE',
    });
  }

  // Central Kitchen Inventory API methods
  async getCentralKitchenInventoryByKitchen(centralKitchenId: string, params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const endpoint = `/central-kitchen-inventory/kitchen/${centralKitchenId}${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }>(endpoint);
  }

  // Central Kitchen Raw Materials API (Dedicated Database)
  async getCentralKitchenRawMaterials(params?: {
    page?: number;
    limit?: number;
    search?: string;
    subCategory?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.subCategory) queryParams.append('subCategory', params.subCategory);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/central-kitchen/raw-materials${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(endpoint);
  }

  async getCentralKitchenRawMaterial(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/central-kitchen/raw-materials/${id}`);
  }

  async createCentralKitchenRawMaterial(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/central-kitchen/raw-materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCentralKitchenRawMaterial(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/central-kitchen/raw-materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCentralKitchenRawMaterial(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/central-kitchen/raw-materials/${id}`, {
      method: 'DELETE',
    });
  }

  async getCentralKitchenRawMaterialCategories() {
    return this.request<{
      success: boolean;
      data: string[];
    }>('/central-kitchen/raw-materials/categories');
  }

  async getCentralKitchenLowStockRawMaterials() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/central-kitchen/raw-materials/low-stock');
  }

  async adjustCentralKitchenRawMaterialStock(id: string, adjustment: number, reason?: string, notes?: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/central-kitchen/raw-materials/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ adjustment, reason, notes }),
    });
  }

  // Central Kitchen Finished Products API (Dedicated Database)
  async getCentralKitchenFinishedProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    subCategory?: string;
    status?: string;
    dietaryRestriction?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.subCategory) queryParams.append('subCategory', params.subCategory);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.dietaryRestriction) queryParams.append('dietaryRestriction', params.dietaryRestriction);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/central-kitchen/finished-products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(endpoint);
  }

  async getCentralKitchenFinishedProduct(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/central-kitchen/finished-products/${id}`);
  }

  async createCentralKitchenFinishedProduct(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/central-kitchen/finished-products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCentralKitchenFinishedProduct(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/central-kitchen/finished-products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCentralKitchenFinishedProduct(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/central-kitchen/finished-products/${id}`, {
      method: 'DELETE',
    });
  }

  async getCentralKitchenFinishedProductCategories() {
    return this.request<{
      success: boolean;
      data: string[];
    }>('/central-kitchen/finished-products/categories');
  }

  async getCentralKitchenLowStockFinishedProducts() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/central-kitchen/finished-products/low-stock');
  }

  async produceCentralKitchenFinishedProduct(id: string, quantity: number, notes?: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/central-kitchen/finished-products/${id}/produce`, {
      method: 'POST',
      body: JSON.stringify({ quantity, notes }),
    });
  }

  async getCentralKitchenInventoryItem(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/central-kitchen-inventory/${id}`);
  }

  async createCentralKitchenInventoryItem(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/central-kitchen-inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCentralKitchenInventoryItem(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/central-kitchen-inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCentralKitchenInventoryItem(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/central-kitchen-inventory/${id}`, {
      method: 'DELETE',
    });
  }

  async adjustCentralKitchenInventoryStock(id: string, adjustment: number, reason?: string, notes?: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/central-kitchen-inventory/${id}/adjust-stock`, {
      method: 'PUT',
      body: JSON.stringify({ adjustment, reason, notes }),
    });
  }

  // Kuwait City Raw Materials API (Dedicated Database)
  async getKuwaitCityRawMaterials(params?: {
    page?: number;
    limit?: number;
    search?: string;
    subCategory?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.subCategory) queryParams.append('subCategory', params.subCategory);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/kuwait-city/raw-materials${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(endpoint);
  }

  async getKuwaitCityRawMaterial(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/kuwait-city/raw-materials/${id}`);
  }

  async createKuwaitCityRawMaterial(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/kuwait-city/raw-materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateKuwaitCityRawMaterial(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/kuwait-city/raw-materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteKuwaitCityRawMaterial(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/kuwait-city/raw-materials/${id}`, {
      method: 'DELETE',
    });
  }

  async getKuwaitCityRawMaterialCategories() {
    return this.request<{
      success: boolean;
      data: string[];
    }>('/kuwait-city/raw-materials/categories');
  }

  async getKuwaitCityLowStockRawMaterials() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/kuwait-city/raw-materials/low-stock');
  }

  async adjustKuwaitCityRawMaterialStock(id: string, adjustment: number, reason?: string, notes?: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/kuwait-city/raw-materials/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ adjustment, reason, notes }),
    });
  }

  // Kuwait City Finished Products API (Dedicated Database)
  async getKuwaitCityFinishedProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    subCategory?: string;
    status?: string;
    dietaryRestriction?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.subCategory) queryParams.append('subCategory', params.subCategory);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.dietaryRestriction) queryParams.append('dietaryRestriction', params.dietaryRestriction);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/kuwait-city/finished-products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(endpoint);
  }

  async getKuwaitCityFinishedProduct(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/kuwait-city/finished-products/${id}`);
  }

  async createKuwaitCityFinishedProduct(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/kuwait-city/finished-products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateKuwaitCityFinishedProduct(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/kuwait-city/finished-products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteKuwaitCityFinishedProduct(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/kuwait-city/finished-products/${id}`, {
      method: 'DELETE',
    });
  }

  async getKuwaitCityFinishedProductCategories() {
    return this.request<{
      success: boolean;
      data: string[];
    }>('/kuwait-city/finished-products/categories');
  }

  async getKuwaitCityLowStockFinishedProducts() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/kuwait-city/finished-products/low-stock');
  }

  async produceKuwaitCityFinishedProduct(id: string, quantity: number, notes?: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/kuwait-city/finished-products/${id}/produce`, {
      method: 'POST',
      body: JSON.stringify({ quantity, notes }),
    });
  }

  // 360 Mall Raw Materials API (Dedicated Database)
  async get360MallRawMaterials(params?: {
    page?: number;
    limit?: number;
    search?: string;
    subCategory?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.subCategory) queryParams.append('subCategory', params.subCategory);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/360-mall/raw-materials${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(endpoint);
  }

  async get360MallRawMaterial(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/360-mall/raw-materials/${id}`);
  }

  async create360MallRawMaterial(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/360-mall/raw-materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update360MallRawMaterial(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/360-mall/raw-materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete360MallRawMaterial(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/360-mall/raw-materials/${id}`, {
      method: 'DELETE',
    });
  }

  async get360MallRawMaterialCategories() {
    return this.request<{
      success: boolean;
      data: string[];
    }>('/360-mall/raw-materials/categories');
  }

  async get360MallLowStockRawMaterials() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/360-mall/raw-materials/low-stock');
  }

  async adjust360MallRawMaterialStock(id: string, adjustment: number, reason?: string, notes?: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/360-mall/raw-materials/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ adjustment, reason, notes }),
    });
  }

  // 360 Mall Finished Products API (Dedicated Database)
  async get360MallFinishedProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    subCategory?: string;
    status?: string;
    dietaryRestriction?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.subCategory) queryParams.append('subCategory', params.subCategory);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.dietaryRestriction) queryParams.append('dietaryRestriction', params.dietaryRestriction);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/360-mall/finished-products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(endpoint);
  }

  async get360MallFinishedProduct(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/360-mall/finished-products/${id}`);
  }

  async create360MallFinishedProduct(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/360-mall/finished-products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update360MallFinishedProduct(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/360-mall/finished-products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete360MallFinishedProduct(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/360-mall/finished-products/${id}`, {
      method: 'DELETE',
    });
  }

  async get360MallFinishedProductCategories() {
    return this.request<{
      success: boolean;
      data: string[];
    }>('/360-mall/finished-products/categories');
  }

  async get360MallLowStockFinishedProducts() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/360-mall/finished-products/low-stock');
  }

  async produce360MallFinishedProduct(id: string, quantity: number, notes?: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/360-mall/finished-products/${id}/produce`, {
      method: 'POST',
      body: JSON.stringify({ quantity, notes }),
    });
  }

  // Vibe Complex Raw Materials API (Dedicated Database)
  async getVibeComplexRawMaterials(params?: {
    page?: number;
    limit?: number;
    search?: string;
    subCategory?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.subCategory) queryParams.append('subCategory', params.subCategory);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/vibe-complex/raw-materials${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(endpoint);
  }

  async getVibeComplexRawMaterial(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/vibe-complex/raw-materials/${id}`);
  }

  async createVibeComplexRawMaterial(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/vibe-complex/raw-materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVibeComplexRawMaterial(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/vibe-complex/raw-materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVibeComplexRawMaterial(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/vibe-complex/raw-materials/${id}`, {
      method: 'DELETE',
    });
  }

  async getVibeComplexRawMaterialCategories() {
    return this.request<{
      success: boolean;
      data: string[];
    }>('/vibe-complex/raw-materials/categories');
  }

  async getVibeComplexLowStockRawMaterials() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/vibe-complex/raw-materials/low-stock');
  }

  async adjustVibeComplexRawMaterialStock(id: string, adjustment: number, reason?: string, notes?: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/vibe-complex/raw-materials/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ adjustment, reason, notes }),
    });
  }

  // Vibe Complex Finished Products API (Dedicated Database)
  async getVibeComplexFinishedProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    subCategory?: string;
    status?: string;
    dietaryRestriction?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.subCategory) queryParams.append('subCategory', params.subCategory);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.dietaryRestriction) queryParams.append('dietaryRestriction', params.dietaryRestriction);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/vibe-complex/finished-products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(endpoint);
  }

  async getVibeComplexFinishedProduct(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/vibe-complex/finished-products/${id}`);
  }

  async createVibeComplexFinishedProduct(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/vibe-complex/finished-products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVibeComplexFinishedProduct(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/vibe-complex/finished-products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVibeComplexFinishedProduct(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/vibe-complex/finished-products/${id}`, {
      method: 'DELETE',
    });
  }

  async getVibeComplexFinishedProductCategories() {
    return this.request<{
      success: boolean;
      data: string[];
    }>('/vibe-complex/finished-products/categories');
  }

  async getVibeComplexLowStockFinishedProducts() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/vibe-complex/finished-products/low-stock');
  }

  async produceVibeComplexFinishedProduct(id: string, quantity: number, notes?: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/vibe-complex/finished-products/${id}/produce`, {
      method: 'POST',
      body: JSON.stringify({ quantity, notes }),
    });
  }

  // Transfer API
  async createTransfer(data: {
    fromOutlet: string;
    toOutlet: string;
    transferDate: string;
    priority: string;
    items: Array<{
      itemType: string;
      itemCode: string;
      quantity: number;
      unitPrice: number;
      notes?: string;
    }>;
    totalValue: number;
    notes?: string;
  }) {
    console.log('🔧 API Service: createTransfer called with data:', data);
    console.log('🔧 API Service: Calling /transfers/create endpoint');
    
    try {
      const response = await this.request<{
        success: boolean;
        message: string;
        data: any;
      }>('/transfers/create', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      console.log('🔧 API Service: createTransfer response:', response);
      return response;
    } catch (error) {
      console.error('🔧 API Service: createTransfer error:', error);
      throw error;
    }
  }

  // Taiba Kitchen Raw Materials API
  async getTaibaKitchenRawMaterials(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<{
      success: boolean;
      data: any[];
      pagination: any;
    }>(`/taiba-kitchen/raw-materials${queryString ? `?${queryString}` : ''}`);
  }

  async getTaibaKitchenRawMaterial(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/taiba-kitchen/raw-materials/${id}`);
  }

  async createTaibaKitchenRawMaterial(data: any) {
    return this.request<{
      success: boolean;
      data: any;
    }>('/taiba-kitchen/raw-materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTaibaKitchenRawMaterial(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/taiba-kitchen/raw-materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTaibaKitchenRawMaterial(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/taiba-kitchen/raw-materials/${id}`, {
      method: 'DELETE',
    });
  }

  async getTaibaKitchenRawMaterialCategories() {
    return this.request<{
      success: boolean;
      data: string[];
    }>('/taiba-kitchen/raw-materials/categories');
  }

  async getTaibaKitchenLowStockRawMaterials() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/taiba-kitchen/raw-materials/low-stock');
  }

  async adjustTaibaKitchenRawMaterialStock(id: string, data: {
    adjustment: number;
    reason?: string;
    updatedBy?: string;
  }) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/taiba-kitchen/raw-materials/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Taiba Kitchen Finished Products API
  async getTaibaKitchenFinishedProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<{
      success: boolean;
      data: any[];
      pagination: any;
    }>(`/taiba-kitchen/finished-products${queryString ? `?${queryString}` : ''}`);
  }

  async getTaibaKitchenFinishedProduct(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/taiba-kitchen/finished-products/${id}`);
  }

  async createTaibaKitchenFinishedProduct(data: any) {
    return this.request<{
      success: boolean;
      data: any;
    }>('/taiba-kitchen/finished-products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTaibaKitchenFinishedProduct(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/taiba-kitchen/finished-products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTaibaKitchenFinishedProduct(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/taiba-kitchen/finished-products/${id}`, {
      method: 'DELETE',
    });
  }

  async getTaibaKitchenFinishedProductCategories() {
    return this.request<{
      success: boolean;
      data: string[];
    }>('/taiba-kitchen/finished-products/categories');
  }

  async getTaibaKitchenLowStockFinishedProducts() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/taiba-kitchen/finished-products/low-stock');
  }

  async produceTaibaKitchenFinishedProduct(id: string, data: {
    quantity: number;
    reason?: string;
    updatedBy?: string;
  }) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/taiba-kitchen/finished-products/${id}/produce`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Transfer Orders API
  async getTransferOrders(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    fromOutlet?: string;
    toOutlet?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<{
      success: boolean;
      data: any[];
      pagination: any;
    }>(`/transfer-orders${queryString ? `?${queryString}` : ''}`);
  }

  async getTransferOrder(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/transfer-orders/${id}`);
  }

  async createTransferOrder(data: {
    fromOutlet: string;
    toOutlet: string;
    transferDate: string;
    priority: string;
    items: Array<{
      itemType: string;
      itemCode: string;
      itemName?: string;
      category?: string;
      subCategory?: string;
      unitOfMeasure?: string;
      quantity: number;
      unitPrice: number;
      notes?: string;
    }>;
    notes?: string;
    requestedBy?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>('/transfer-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTransferOrderById(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/transfer-orders/${id}`);
  }

  async updateTransferOrderStatus(id: string, data: {
    status: string;
    approvedBy?: string;
    notes?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/transfer-orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateTransferOrderInventory(id: string, action: 'approve' | 'reject') {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/transfer-order-inventory/${id}/${action}`, {
      method: 'PUT',
    });
  }

  async deleteTransferOrder(id: string, data?: { updatedBy?: string }) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/transfer-orders/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(data || {}),
    });
  }

  async getTransferOrderStats() {
    return this.request<{
      success: boolean;
      data: {
        totalOrders: number;
        totalAmount: number;
        statusBreakdown: Array<{
          _id: string;
          count: number;
          totalAmount: number;
        }>;
      };
    }>('/transfer-orders/stats/summary');
  }

  // Notification API methods
  async getNotifications(outletName: string, type?: string, limit?: number) {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/${outletName}?${queryString}` : `/${outletName}`;
    
    console.log(`🔔 API Service: getNotifications called for outlet: "${outletName}"`)
    console.log(`🔔 API Service: Constructed endpoint: "/notifications${endpoint}"`)
    
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        title: string;
        message: string;
        type: string;
        targetOutlet: string;
        sourceOutlet: string;
        transferOrderId?: string;
        itemType?: string;
        priority: string;
        timestamp: string;
        read: boolean;
        createdAt: string;
      }>;
    }>(`/notifications${endpoint}`);
  }

  async createNotification(data: {
    title: string;
    message: string;
    type: string;
    targetOutlet: string;
    sourceOutlet?: string;
    transferOrderId?: string;
    itemType?: string;
    priority?: string;
  }) {
    console.log('🔔 API Service: createNotification called with data:', data);
    
    try {
      const response = await this.request<{
        success: boolean;
        message: string;
        data: any;
      }>('/notifications', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      console.log('🔔 API Service: createNotification response:', response);
      return response;
    } catch (error) {
      console.error('🔔 API Service: createNotification error:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(outletName: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/notifications/mark-all-read/${outletName}`, {
      method: 'PUT',
    });
  }

  async clearAllNotifications(outletName: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/notifications/clear-all/${outletName}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
