import { obtenerProductos } from '../services/productosService';

export async function fetchProductsPageData() {
  const productList = await obtenerProductos();

  return {
    products: Array.isArray(productList) ? productList : [],
  };
}
