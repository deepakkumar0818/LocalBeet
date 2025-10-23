
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; message: string }>('/health');
  }

  // Raw Materials API
  async getRawMaterials(params?: {
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
    const endpoint = `/raw-materials${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  async createRawMaterial(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/raw-materials', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateRawMaterial(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/raw-materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteRawMaterial(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/raw-materials/${id}`, {
      method: 'DELETE'
    });
  }

  async syncWithZohoRawMaterials() {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        totalItems: number;
        itemsWithSKU: number;
        itemsWithoutSKU: number;
        addedItems: number;
        updatedItems: number;
        errorItems: number;
        syncTimestamp: string;
      };
    }>('/sync-zoho/raw-materials', {
      method: 'POST'
    });
  }

  // Central Kitchen API
  async getCentralKitchens() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/central-kitchen');
  }

  async getCentralKitchenRawMaterials(params?: {
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
    const endpoint = `/central-kitchen/raw-materials${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  async getCentralKitchenFinishedProducts(params?: {
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
    const endpoint = `/central-kitchen/finished-products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  // Kuwait City API
  async getKuwaitCityRawMaterials(params?: {
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
    const endpoint = `/kuwait-city/raw-materials${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  async getKuwaitCityFinishedProducts(params?: {
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
    const endpoint = `/kuwait-city/finished-products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  // 360 Mall API
  async get360MallRawMaterials(params?: {
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
    const endpoint = `/360-mall/raw-materials${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  async get360MallFinishedProducts(params?: {
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
    const endpoint = `/360-mall/finished-products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  // Vibe Complex API
  async getVibesComplexRawMaterials(params?: {
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
    const endpoint = `/vibe-complex/raw-materials${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  async getVibeComplexRawMaterials(params?: {
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
    const endpoint = `/vibe-complex/raw-materials${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  async getVibesComplexFinishedProducts(params?: {
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
    const endpoint = `/vibe-complex/finished-products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  async getVibeComplexFinishedProducts(params?: {
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
    const endpoint = `/vibe-complex/finished-products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  // Taiba Kitchen API
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
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/taiba-kitchen/raw-materials${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  async getTaibaKitchenFinishedProducts(params?: {
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
    const endpoint = `/taiba-kitchen/finished-products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  // Notifications API
  async getNotifications(outletName: string, type?: string, limit?: number) {
    const queryParams = new URLSearchParams();
    if (type) queryParams.append('type', type);
    if (limit) queryParams.append('limit', limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/notifications/${encodeURIComponent(outletName)}${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
    }>(endpoint);
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  }

  async markAllNotificationsAsRead(outletName: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/notifications/mark-all-read`, {
      method: 'PUT',
      body: JSON.stringify({ outlet: outletName })
    });
  }

  async clearAllNotifications(outletName: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/notifications/clear-all`, {
      method: 'DELETE',
      body: JSON.stringify({ outlet: outletName })
    });
  }

  async createNotification(notificationData: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/notifications`, {
      method: 'POST',
      body: JSON.stringify(notificationData)
    });
  }

  // Transfer Orders API
  async getTransferOrderById(id: string) {
    return this.request<{
      success: boolean;
      data: any;
      message?: string;
    }>(`/transfer-orders/${id}`);
  }

  async createTransferOrder(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/transfers/create`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTransferOrderStatus(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/transfer-orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateTransferOrderInventory(id: string, action: 'approve' | 'reject') {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/transfer-order-inventory/${id}/${action}`, {
      method: 'PUT',
      body: JSON.stringify({ action })
    });
  }

  // Additional common methods that might be missing
  async getOutlets() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/outlets');
  }

  async getFinishedGoods(params?: {
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
    const endpoint = `/finished-goods${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  async createFinishedGood(data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/finished-goods', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateFinishedGood(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/finished-goods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteFinishedGood(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/finished-goods/${id}`, {
      method: 'DELETE'
    });
  }

  // Transfer Orders
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
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.fromOutlet) queryParams.append('fromOutlet', params.fromOutlet);
    if (params?.toOutlet) queryParams.append('toOutlet', params.toOutlet);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/transfer-orders${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        page: number;
        pages: number;
        total: number;
        limit: number;
      };
    }>(endpoint);
  }

  async deleteTransferOrder(id: string, options?: { updatedBy?: string }) {
    const body = options ? JSON.stringify(options) : undefined;
    return this.request<{
      success: boolean;
      message: string;
    }>(`/transfer-orders/${id}`, {
      method: 'DELETE',
      body: body
    });
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
      body: JSON.stringify(data)
    });
  }

  async approveTransferOrder(id: string, data: {
    approvedBy?: string;
    notes?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/transfer-order-inventory/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async rejectTransferOrder(id: string, data: {
    approvedBy?: string;
    notes?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/transfer-order-inventory/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Bill of Materials (Recipe Master)
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
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  async getBillOfMaterialById(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/bill-of-materials/${id}`);
  }

  async createBillOfMaterial(data: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/bill-of-materials`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateBillOfMaterial(id: string, data: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/bill-of-materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteBillOfMaterial(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/bill-of-materials/${id}`, {
      method: 'DELETE'
    });
  }

  // Transfers (for Central Kitchen to Outlets)
  async createTransfer(data: {
    fromOutlet: string;
    toOutlet: string;
    transferDate: string;
    priority: string;
    items: any[];
    totalValue?: number;
    notes?: string;
    requestedBy?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        transferId: string;
        transferNumber: string;
        _id: string;
        id: string;
        fromOutlet: string;
        toOutlet: string;
        transferDate: string;
        priority: string;
        items: any[];
        totalValue: number;
        notes: string;
        createdAt: string;
      };
    }>(`/transfers/create`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Transfer Orders (for Outlet requests to Central Kitchen - creates pending orders)
  async createTransferOrder(data: {
    fromOutlet: string;
    toOutlet: string;
    transferDate: string;
    priority: string;
    items: any[];
    notes?: string;
    requestedBy?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        transferId: string;
        transferNumber: string;
        _id: string;
        id: string;
        fromOutlet: string;
        toOutlet: string;
        transferDate: string;
        priority: string;
        items: any[];
        totalValue: number;
        notes: string;
        status: string;
        createdAt: string;
      };
    }>(`/transfer-orders`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Sales Orders API
  async getSalesOrders(params?: {
    page?: number;
    limit?: number;
    search?: string;
    outletId?: string;
    outletCode?: string;
    outletName?: string;
    orderStatus?: string;
    orderType?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.outletId) queryParams.append('outletId', params.outletId);
    if (params?.outletCode) queryParams.append('outletCode', params.outletCode);
    if (params?.outletName) queryParams.append('outletName', params.outletName);
    if (params?.orderStatus) queryParams.append('orderStatus', params.orderStatus);
    if (params?.orderType) queryParams.append('orderType', params.orderType);
    if (params?.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/sales-orders${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }>(endpoint);
  }

  async getSalesOrderById(id: string) {
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
    }>('/sales-orders', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateSalesOrder(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/sales-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteSalesOrder(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/sales-orders/${id}`, {
      method: 'DELETE'
    });
  }

  async updateSalesOrderStatus(id: string, data: {
    orderStatus: string;
    updatedBy?: string;
  }) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/sales-orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Ingredient Master Transfer Methods
  async createIngredientMasterTransfer(data: {
    toOutlet: string;
    transferDate: string;
    priority: string;
    notes?: string;
    items: any[];
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        transferId: string;
        transferNumber: string;
        _id: string;
        id: string;
        fromOutlet: string;
        toOutlet: string;
        transferDate: string;
        priority: string;
        items: any[];
        totalValue: number;
        notes: string;
        status: string;
        createdAt: string;
      };
    }>(`/ingredient-master/create-transfer`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Purchase Orders API
  async getPurchaseOrders(params?: {
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
    const endpoint = `/purchase-orders${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  async getPurchaseOrderById(id: string) {
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
      body: JSON.stringify(data)
    });
  }

  async updatePurchaseOrder(id: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deletePurchaseOrder(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/purchase-orders/${id}`, {
      method: 'DELETE'
    });
  }

  async syncZohoBillsToPurchaseOrders() {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        totalBills: number;
        addedOrders: number;
        updatedOrders: number;
        errorCount: number;
        syncTimestamp: string;
      };
    }>('/sync-zoho-bills/purchase-orders', {
      method: 'POST'
    });
  }
}

export const apiService = new ApiService();