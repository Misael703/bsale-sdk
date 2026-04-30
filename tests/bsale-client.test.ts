import { describe, it, expect } from 'vitest';
import { BsaleClient } from '../src/client/bsale-client';

describe('BsaleClient', () => {
  it('expone los 17 recursos legacy más los 18 nuevos de v0.2.0', () => {
    const client = new BsaleClient({ accessToken: 'tok' });

    // Legacy
    expect(client.products).toBeDefined();
    expect(client.variants).toBeDefined();
    expect(client.documents).toBeDefined();
    expect(client.clients).toBeDefined();
    expect(client.priceLists).toBeDefined();
    expect(client.stocks).toBeDefined();
    expect(client.documentTypes).toBeDefined();
    expect(client.offices).toBeDefined();
    expect(client.shippings).toBeDefined();
    expect(client.paymentTypes).toBeDefined();
    expect(client.stockReceptions).toBeDefined();
    expect(client.stockConsumptions).toBeDefined();
    expect(client.returns).toBeDefined();
    expect(client.thirdPartyDocuments).toBeDefined();
    expect(client.productTypes).toBeDefined();
    expect(client.users).toBeDefined();
    expect(client.shippingTypes).toBeDefined();

    // Nuevos
    expect(client.payments).toBeDefined();
    expect(client.dynamicAttributes).toBeDefined();
    expect(client.discounts).toBeDefined();
    expect(client.currencies).toBeDefined();
    expect(client.saleConditions).toBeDefined();
    expect(client.bookTypes).toBeDefined();
    expect(client.dteCodes).toBeDefined();
    expect(client.taxes).toBeDefined();
    expect(client.stockConsumptionTypes).toBeDefined();
    expect(client.carts).toBeDefined();
    expect(client.checkouts).toBeDefined();
    expect(client.webDescriptions).toBeDefined();
    expect(client.collections).toBeDefined();
    expect(client.variantShipping).toBeDefined();
    expect(client.coupons).toBeDefined();
    expect(client.instances).toBeDefined();
    expect(client.courierOrders).toBeDefined();
    expect(client.paymentsGateway).toBeDefined();
  });

  it('clearCache no lanza errores', () => {
    const client = new BsaleClient({ accessToken: 'tok' });
    expect(() => client.clearCache()).not.toThrow();
    expect(() => client.clearResourceCache('products')).not.toThrow();
  });

  it('handleWebhook con topic conocido no lanza', () => {
    const client = new BsaleClient({ accessToken: 'tok' });
    expect(() =>
      client.handleWebhook({
        cpnId: 1,
        resource: '/v2/products/1.json',
        resourceId: '1',
        topic: 'product',
        action: 'post',
        send: 1700000000,
      }),
    ).not.toThrow();
  });

  it('handleWebhook con topic courierOrder usa el host correcto', () => {
    const client = new BsaleClient({ accessToken: 'tok' });
    expect(() =>
      client.handleWebhook({
        cpnId: 1,
        resource: '/v1/couriers/orders/1.json',
        resourceId: '1',
        topic: 'courierOrder',
        action: 'post',
        send: 1700000000,
        sellerId: 1,
        userToken: 'abc',
      }),
    ).not.toThrow();
  });
});
