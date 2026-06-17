import { obtenerProductos } from '../services/productosServices';

export async function fetchProductsPageData() {
  const productList = await obtenerProductos();

  return {
    products: Array.isArray(productList) ? productList : [],
  };
}
