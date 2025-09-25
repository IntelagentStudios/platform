import { IntegrationAdapter, IntegrationConfig, IntegrationMetadata, IntegrationData } from './IntegrationAdapter';

export class ShopifyAdapter extends IntegrationAdapter {
  metadata: IntegrationMetadata = {
    id: 'shopify',
    name: 'Shopify',
    description: 'Connect to Shopify for e-commerce operations',
    icon: '🛒',
    category: 'ecommerce',
    requiredScopes: [
      'read_products',
      'write_products',
      'read_orders',
      'write_orders',
      'read_customers',
      'write_customers',
      'read_inventory',
      'write_inventory'
    ],
    supportedActions: [
      'create_product',
      'update_product',
      'update_inventory',
      'create_discount',
      'fulfill_order',
      'cancel_order',
      'create_customer',
      'update_customer'
    ],
    supportedTriggers: [
      'order_created',
      'order_updated',
      'order_fulfilled',
      'order_cancelled',
      'product_created',
      'product_updated',
      'inventory_low'
    ]
  };

  private shopDomain: string = '';
  private apiVersion = '2024-01';

  async initialize(): Promise<boolean> {
    if (!this.config.accessToken || !this.config.domain) {
      throw new Error('Shopify requires accessToken and shop domain');
    }

    this.shopDomain = this.config.domain;

    // Verify connection
    try {
      const response = await fetch(
        `https://${this.shopDomain}/admin/api/${this.apiVersion}/shop.json`,
        {
          headers: {
            'X-Shopify-Access-Token': this.config.accessToken,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.ok;
    } catch (error) {
      console.error('Shopify initialization failed:', error);
      return false;
    }
  }

  async fetchData(endpoint: string, params?: Record<string, any>): Promise<IntegrationData> {
    const url = new URL(`https://${this.shopDomain}/admin/api/${this.apiVersion}/${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'X-Shopify-Access-Token': this.config.accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Shopify fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformToCommon(data);
  }

  async pushData(endpoint: string, data: any): Promise<IntegrationData> {
    const response = await fetch(
      `https://${this.shopDomain}/admin/api/${this.apiVersion}/${endpoint}`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': this.config.accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    );

    if (!response.ok) {
      throw new Error(`Shopify push failed: ${response.statusText}`);
    }

    const result = await response.json();
    return this.transformToCommon(result);
  }

  async getAvailableFields(): Promise<string[]> {
    // Return common Shopify fields
    return [
      'id',
      'title',
      'handle',
      'vendor',
      'product_type',
      'tags',
      'price',
      'sku',
      'inventory_quantity',
      'weight',
      'status',
      'order_number',
      'email',
      'total_price',
      'subtotal_price',
      'tax',
      'shipping',
      'customer_id',
      'created_at',
      'updated_at'
    ];
  }

  // Shopify-specific methods
  async getProducts(limit: number = 50): Promise<IntegrationData> {
    return this.fetchData('products.json', { limit: limit.toString() });
  }

  async createProduct(productData: any): Promise<IntegrationData> {
    return this.pushData('products.json', { product: productData });
  }

  async updateInventory(inventoryItemId: string, quantity: number): Promise<IntegrationData> {
    const response = await fetch(
      `https://${this.shopDomain}/admin/api/${this.apiVersion}/inventory_levels/set.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': this.config.accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inventory_item_id: inventoryItemId,
          available: quantity,
          disconnect_if_necessary: true
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update inventory: ${response.statusText}`);
    }

    const result = await response.json();
    return this.transformToCommon(result);
  }

  async getOrders(status: string = 'open'): Promise<IntegrationData> {
    return this.fetchData('orders.json', { status });
  }

  async fulfillOrder(orderId: string, trackingInfo?: any): Promise<IntegrationData> {
    const fulfillmentData: any = {
      fulfillment: {
        notify_customer: true
      }
    };

    if (trackingInfo) {
      fulfillmentData.fulfillment.tracking_info = trackingInfo;
    }

    return this.pushData(`orders/${orderId}/fulfillments.json`, fulfillmentData);
  }

  async subscribeWebhook(topic: string, callbackUrl: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://${this.shopDomain}/admin/api/${this.apiVersion}/webhooks.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': this.config.accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            webhook: {
              topic,
              address: callbackUrl,
              format: 'json'
            }
          })
        }
      );
      return response.ok;
    } catch (error) {
      console.error('Failed to subscribe webhook:', error);
      return false;
    }
  }
}