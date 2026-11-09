import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const serviceMocks = vi.hoisted(() => ({
  actualizarProducto: vi.fn(),
  actualizarStockCentral: vi.fn(),
  crearProducto: vi.fn(),
  subirImagenProducto: vi.fn(),
  obtenerStockDesglosadoProducto: vi.fn().mockResolvedValue({
    productId: "1",
    locations: [{ code: "BODEGA_CENTRAL", name: "Bodega Central", stock: 12 }],
  }),
}))

const hookMocks = vi.hoisted(() => ({
  catalog: { data: [], status: 'idle', error: null, loading: false, retry: vi.fn() },
  stock: { data: [], status: 'success', error: null, loading: false, retry: vi.fn() },
}))

const sessionMocks = vi.hoisted(() => ({
  getActiveSessionUser: vi.fn(),
}))

vi.mock('../../../services/productosService', () => ({
  ...serviceMocks,
  calcularPrecioConIVA: (value) => Math.round((Number(value) || 0) * 1.13),
}))

vi.mock('../../../hooks/useProductCatalog', () => ({
  useProductCatalog: () => hookMocks.catalog,
}))
vi.mock('../../../hooks/useCentralStock', () => ({
  useCentralStock: () => hookMocks.stock,
}))

vi.mock('../../../services/sessionService', () => sessionMocks)
vi.mock('../../../hooks/useAdminPageGate', () => ({
  useAdminPageGate: () => ({ showLoading: false, loadingMessage: '' }),
}))
vi.mock('../../../Components/AdminPageGate/AdminPageGate', () => ({
  AdminPageGate: ({ children }) => children,
}))
vi.mock('../layouts/AdminLayout', () => ({
  AdminLayout: ({ children }) => <main>{children}</main>,
}))

import AdminInventarioProducto from './InventarioProducto'
import {
  clearPendingStockProduct,
  peekPendingStockProduct,
  requestAdminStockProduct,
} from '../../../lib/adminStockAlert'

const products = [
  {
    id: 1,
    nombre: 'Café Premium',
    descripcion: 'Café de altura',
    imagen: '',
    precioNormal: 5000,
    stock: 12,
    estado: 'Habilitado',
    peso: '500g',
    esDestacado: true,
  },
  {
    id: 2,
    nombre: 'Té Verde',
    descripcion: 'Infusión artesanal',
    imagen: '',
    precioNormal: 3000,
    stock: 0,
    estado: 'Habilitado',
    peso: '250g',
    esDestacado: false,
  },
]

function renderPage({ role = 'SuperAdmin', data = products } = {}) {
  sessionMocks.getActiveSessionUser.mockReturnValue({ role })
  hookMocks.catalog = {
    data: data.map(({ stock, ...producto }) => producto),
    status: 'success',
    error: null,
    loading: false,
    retry: vi.fn(),
  }
  hookMocks.stock = {
    data: data.map((producto) => ({
      productId: String(producto.id),
      locationCode: 'BODEGA_CENTRAL',
      stock: producto.stock,
      confidence: 'known',
    })),
    status: 'success',
    error: null,
    loading: false,
    retry: vi.fn(),
  }
  return render(<AdminInventarioProducto />)
}

describe('InventarioProducto characterization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading while the catalog request is pending', () => {
    sessionMocks.getActiveSessionUser.mockReturnValue({ role: 'SuperAdmin' })
    hookMocks.catalog = { data: [], status: 'loading', error: null, loading: true, retry: vi.fn() }

    render(<AdminInventarioProducto />)

    expect(screen.getByText('Cargando productos...')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /nuevo producto/i })).not.toBeInTheDocument()
  })

  it('keeps a failed request retryable and restores catalog content', async () => {
    const user = userEvent.setup()
    sessionMocks.getActiveSessionUser.mockReturnValue({ role: 'SuperAdmin' })
    hookMocks.catalog = {
      data: [],
      status: 'error',
      error: new Error('network'),
      loading: false,
      retry: vi.fn(),
    }

    render(<AdminInventarioProducto />)

    expect(await screen.findByText('network')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(hookMocks.catalog.retry).toHaveBeenCalledTimes(1)
  })

  it('filters records and renders the current desktop and mobile representations', async () => {
    const user = userEvent.setup()
    const { container } = renderPage()

    expect(await screen.findAllByText('Café Premium')).toHaveLength(2)
    expect(container.querySelector('table')).toBeInTheDocument()
    expect(container.querySelector('ul > li')).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'Buscar producto' }), 'Premium')

    expect(screen.getByText(/Mostrando/)).toHaveTextContent('Mostrando 1 de 2')
    expect(screen.queryByText('Té Verde')).not.toBeInTheDocument()
  })

  it('keeps catalog data visible without privileged mutation controls', async () => {
    renderPage({ role: 'Visitante' })

    expect(await screen.findAllByText('Café Premium')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /nuevo producto/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Desactivar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Inhabilitar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument()
  })

  it('shows central stock editing only to authorized staff and keeps catalog visible on stock failure', async () => {
    const user = userEvent.setup()
    sessionMocks.getActiveSessionUser.mockReturnValue({ rol: 'Admin' })
    hookMocks.catalog = {
      data: products.map(({ stock, ...producto }) => producto),
      status: 'success',
      error: null,
      loading: false,
      retry: vi.fn(),
    }
    hookMocks.stock = {
      data: [],
      status: 'error',
      error: new Error('stock unavailable'),
      loading: false,
      retry: vi.fn(),
    }

    render(<AdminInventarioProducto />)

    expect(await screen.findAllByText('Café Premium')).toHaveLength(2)
    expect(screen.getByText(/catálogo está disponible/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Ajustar stock de/ })).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Ajustar stock de Café Premium' }))
    const dialog = screen.getByRole('dialog', { name: 'Stock de Bodega Central' })
    await user.type(within(dialog).getByRole('textbox', { name: /^Unidades disponibles/ }), '7')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar stock' }))

    await waitFor(() => expect(serviceMocks.actualizarStockCentral).toHaveBeenCalledWith(1, 7))
    expect(hookMocks.stock.retry).toHaveBeenCalled()
  })

  it('opens the edit drawer from a row click and from the overflow menu', async () => {
    const user = userEvent.setup()
    const { container } = renderPage()
    const table = container.querySelector('table')

    await user.click(within(table).getByText('Té Verde'))
    expect(screen.getByRole('dialog', { name: 'Editar producto' })).toBeInTheDocument()
  })

  it('asks for confirmation before deactivating and only then updates the product', async () => {
    const user = userEvent.setup()
    const { container } = renderPage()
    const table = container.querySelector('table')

    await user.click(within(table).getByRole('button', { name: 'Más acciones de Té Verde' }))
    await user.click(screen.getByRole('menuitem', { name: 'Desactivar' }))

    const dialog = screen.getByRole('dialog', { name: 'Desactivar Té Verde' })
    expect(serviceMocks.actualizarProducto).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: 'Desactivar' }))

    await waitFor(() =>
      expect(serviceMocks.actualizarProducto).toHaveBeenCalledWith(2, expect.objectContaining({ estado: 'Deshabilitado' })),
    )
    expect(hookMocks.catalog.retry).toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Desactivar Té Verde' })).not.toBeInTheDocument())
  })

  it('does not deactivate when the confirmation is cancelled', async () => {
    const user = userEvent.setup()
    const { container } = renderPage()
    const table = container.querySelector('table')

    await user.click(within(table).getByRole('button', { name: 'Más acciones de Té Verde' }))
    await user.click(screen.getByRole('menuitem', { name: 'Desactivar' }))
    await user.click(within(screen.getByRole('dialog', { name: 'Desactivar Té Verde' })).getByRole('button', { name: 'Cancelar' }))

    expect(serviceMocks.actualizarProducto).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog', { name: 'Desactivar Té Verde' })).not.toBeInTheDocument()
  })

  it('activates an inactive product immediately, without a confirmation dialog', async () => {
    const user = userEvent.setup()
    const { container } = renderPage({
      data: [{ ...products[1], estado: 'Deshabilitado' }],
    })
    const table = container.querySelector('table')

    await user.click(within(table).getByRole('button', { name: 'Más acciones de Té Verde' }))
    await user.click(screen.getByRole('menuitem', { name: 'Activar' }))

    await waitFor(() =>
      expect(serviceMocks.actualizarProducto).toHaveBeenCalledWith(2, expect.objectContaining({ estado: 'Habilitado' })),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('toggles the featured star through the existing handler and keeps the three-product limit', async () => {
    const user = userEvent.setup()
    const { container } = renderPage({
      data: [
        { ...products[0], esDestacado: true },
        { ...products[1], stock: 8 },
      ],
    })
    const table = container.querySelector('table')

    await user.click(within(table).getByRole('button', { name: 'Destacar Té Verde en inicio' }))
    await waitFor(() => expect(serviceMocks.actualizarProducto).toHaveBeenCalledWith(2, { esDestacado: true }))

    await user.click(within(table).getByRole('button', { name: 'Quitar Café Premium de destacados' }))
    await waitFor(() => expect(serviceMocks.actualizarProducto).toHaveBeenCalledWith(1, { esDestacado: false }))
  })

  it('validates required fields and exposes the pending create request state', async () => {
    const user = userEvent.setup()
    let resolveCreate
    serviceMocks.crearProducto.mockReturnValue(new Promise((resolve) => {
      resolveCreate = resolve
    }))
    renderPage()

    await screen.findAllByText('Café Premium')
    await user.click(screen.getByRole('button', { name: /nuevo producto/i }))
    const dialog = screen.getByRole('dialog', { name: 'Nuevo producto' })
    const submit = within(dialog).getByRole('button', { name: 'Crear producto' })

    fireEvent.submit(submit.closest('form'))
    expect(within(dialog).getByText('Ingrese el nombre del producto.')).toBeInTheDocument()
    expect(within(dialog).getByText('Ingrese la descripción del producto.')).toBeInTheDocument()

    await user.type(within(dialog).getByRole('textbox', { name: /^Nombre/ }), 'Café nuevo')
    await user.type(within(dialog).getByRole('textbox', { name: /^Descripción/ }), 'Descripción válida')
    await user.type(within(dialog).getByRole('textbox', { name: 'Precio normal' }), '1000')
    await user.click(submit)

    await waitFor(() => expect(serviceMocks.crearProducto).toHaveBeenCalledTimes(1))
    expect(within(dialog).getByRole('button', { name: 'Guardando...' })).toBeDisabled()

    await act(async () => {
      resolveCreate(products[0])
    })
  })

  it('does not leave a delayed cleanup timer behind when unmounted after opening a pending stock request', () => {
    requestAdminStockProduct('1', { nombre: 'Café Premium' })
    const { unmount } = renderPage()

    unmount()

    expect(peekPendingStockProduct()).toBeNull()
    clearPendingStockProduct()
  })
})
