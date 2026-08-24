import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const serviceMocks = vi.hoisted(() => ({
  actualizarProducto: vi.fn(),
  crearProducto: vi.fn(),
  eliminarProducto: vi.fn(),
  obtenerProductos: vi.fn(),
}))

const sessionMocks = vi.hoisted(() => ({
  getActiveSessionUser: vi.fn(),
}))

vi.mock('../../../services/productosService', () => ({
  ...serviceMocks,
  calcularPrecioConIVA: (value) => Math.round((Number(value) || 0) * 1.13),
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
  serviceMocks.obtenerProductos.mockResolvedValue(data)
  return render(<AdminInventarioProducto />)
}

describe('InventarioProducto characterization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading while the catalog request is pending', () => {
    sessionMocks.getActiveSessionUser.mockReturnValue({ role: 'SuperAdmin' })
    serviceMocks.obtenerProductos.mockReturnValue(new Promise(() => {}))

    render(<AdminInventarioProducto />)

    expect(screen.getByText('Cargando productos...')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /nuevo producto/i })).not.toBeInTheDocument()
  })

  it('keeps a failed request retryable and restores catalog content', async () => {
    const user = userEvent.setup()
    sessionMocks.getActiveSessionUser.mockReturnValue({ role: 'SuperAdmin' })
    serviceMocks.obtenerProductos
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(products)

    render(<AdminInventarioProducto />)

    expect(await screen.findByText('No se pudieron cargar los productos.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findAllByText('Café Premium')).toHaveLength(2)
    expect(serviceMocks.obtenerProductos).toHaveBeenCalledTimes(2)
  })

  it('filters records and renders the current desktop and mobile representations', async () => {
    const user = userEvent.setup()
    const { container } = renderPage()

    expect(await screen.findAllByText('Café Premium')).toHaveLength(2)
    expect(container.querySelector('table')).toBeInTheDocument()
    expect(container.querySelector('article')).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'Premium')

    expect(screen.getByText(/Mostrando/)).toHaveTextContent('Mostrando 1 de 2')
    expect(screen.queryByText('Té Verde')).not.toBeInTheDocument()
  })

  it('keeps catalog data visible without privileged mutation controls', async () => {
    renderPage({ role: 'Visitante' })

    expect(await screen.findAllByText('Café Premium')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /nuevo producto/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Inhabilitar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument()
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
    await user.type(within(dialog).getByRole('spinbutton', { name: 'Precio normal' }), '1000')
    await user.click(submit)

    await waitFor(() => expect(serviceMocks.crearProducto).toHaveBeenCalledTimes(1))
    expect(within(dialog).getByRole('button', { name: 'Guardando...' })).toBeDisabled()

    await act(async () => {
      resolveCreate(products[0])
    })
  })
})
