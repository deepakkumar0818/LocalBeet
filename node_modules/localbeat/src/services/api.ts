const API_BASE_URL = '/api';

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

  async getCentralKitchens() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/outlets/central-kitchen/list');
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
}

export const apiService = new ApiService();
