import { describe, it, expectTypeOf } from 'vitest';
import { BsaleClient } from '../src/client/bsale-client';
import type {
  BsaleExpandKeys,
  BsaleListResponse,
  BsaleProduct,
  BsaleQueryParams,
  BsaleStock,
  BsaleVariant,
  BsaleVariantWithProduct,
} from '../src/types';

const client = new BsaleClient({ accessToken: 'tk' });

describe('expand tipado', () => {
  it('iterate con expand product entrega el producto completo', async () => {
    for await (const variant of client.variants.iterate({ expand: 'product' })) {
      expectTypeOf(variant).toEqualTypeOf<BsaleVariantWithProduct>();
      expectTypeOf(variant.product).toEqualTypeOf<BsaleProduct>();
      expectTypeOf(variant.product.id).toEqualTypeOf<number>();
      expectTypeOf(variant.product.name).toEqualTypeOf<string | null>();
      expectTypeOf(variant.id).toEqualTypeOf<number>();
    }
  });

  it('list, listAll y getById también tipan el expand', () => {
    expectTypeOf(client.variants.list({ expand: 'product', limit: 50 })).resolves.toEqualTypeOf<
      BsaleListResponse<BsaleVariantWithProduct>
    >();
    expectTypeOf(client.variants.listAll({ expand: 'product' })).resolves.toEqualTypeOf<
      BsaleVariantWithProduct[]
    >();
    expectTypeOf(
      client.variants.getById(1, { expand: 'product' }),
    ).resolves.toEqualTypeOf<BsaleVariantWithProduct>();
  });

  it('una lista de relaciones con product también lo expande', () => {
    expectTypeOf(client.variants.getById('1', { expand: 'product,attribute_values' }))
      .resolves.toHaveProperty('product')
      .toEqualTypeOf<BsaleProduct>();
  });

  it('sin expand, la referencia al producto trae el id como string', () => {
    expectTypeOf(client.variants.list()).resolves.toEqualTypeOf<BsaleListResponse<BsaleVariant>>();
    expectTypeOf<NonNullable<BsaleVariant['product']>['id']>().toEqualTypeOf<string>();
  });

  it('un expand no literal o sin mapa no cambia el tipo', () => {
    const runtimeExpand: string = ['product'].join(',');
    expectTypeOf(client.variants.list({ expand: runtimeExpand })).resolves.toEqualTypeOf<
      BsaleListResponse<BsaleVariant>
    >();
    expectTypeOf(client.variants.list({ expand: 'attribute_values' })).resolves.toEqualTypeOf<
      BsaleListResponse<BsaleVariant>
    >();
    expectTypeOf(client.stocks.list({ expand: 'variant' })).resolves.toEqualTypeOf<
      BsaleListResponse<BsaleStock>
    >();
  });

  it('BsaleExpandKeys separa por coma y recorta espacios', () => {
    expectTypeOf<BsaleExpandKeys<'product, costs'>>().toEqualTypeOf<'product' | 'costs'>();
  });
});

describe('BsaleQueryParams', () => {
  it('los filtros dinámicos no son any', () => {
    const params: BsaleQueryParams = { state: 0, productid: '24410' };
    expectTypeOf(params.productid).not.toBeAny();
    expectTypeOf(params.productid).toEqualTypeOf<string | number | boolean | null | undefined>();
  });

  it('rechaza valores que no se serializan bien en la URL', () => {
    // @ts-expect-error un objeto se serializaría como "[object Object]"
    const bad: BsaleQueryParams = { state: { value: 0 } };
    void bad;
  });
});

describe('ids de relación que llegan como string', () => {
  it('stock, lista de precio y tipo de producto', () => {
    expectTypeOf<NonNullable<BsaleStock['office']>['id']>().toEqualTypeOf<string>();
    expectTypeOf<NonNullable<BsaleStock['variant']>['id']>().toEqualTypeOf<string>();
    expectTypeOf<NonNullable<BsaleProduct['product_type']>['id']>().toEqualTypeOf<string>();
  });

  it('los métodos aceptan esos ids sin conversión', () => {
    const variant = {} as BsaleVariant;
    const productId = variant.product?.id ?? '0';
    expectTypeOf(client.products.getById).toBeCallableWith(productId);
    expectTypeOf(client.products.getVariants).toBeCallableWith(productId);
  });
});
