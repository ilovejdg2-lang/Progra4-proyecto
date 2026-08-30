/* eslint-disable react-refresh/only-export-components */
import {
    createRootRoute,
    createRoute,
    createRouter,
    Navigate,
    Outlet,
    useRouterState,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useLayoutEffect } from "react";

import AdminRouteLoading from "./Components/Admin/AdminRouteLoading";
import CartAddedToast from "./Components/CartAddedToast/CartAddedToast";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary";
import Footer from "./Components/Footer/Footer";
import Navbar from './Components/Navbar/Navbar';
import PageLoading from "./Components/PageLoading/PageLoading";
import Home from "./Pages/Home/Home";
import NotFound from "./Pages/NotFound/NotFound";
import { usePublicPageLoadingGate } from "./hooks/usePublicPageLoadingGate";
import { getRouteCacheKey, isPageInstantReady } from "./lib/pageSessionState";
import { clearHomePageLoading, setHomePageLoading } from "./lib/homePageLoading";
import { beginRouteLoading, endRouteLoading } from "./lib/routeLoadingLock";
import { getSiteBootMessage } from "./lib/siteBootLoading";

const AboutUs = lazy(() => import("./Pages/AboutUs/AboutUs"));
const Products = lazy(() => import("./Pages/Products/Products"));
const ProductDetail = lazy(() => import("./Pages/ProductDetail/ProductDetail"));
const SolicitarVoluntariado = lazy(() => import("./Pages/Voluntariado/SolicitarVoluntariado"));
const Login = lazy(() => import("./Pages/Login/Login"));
const AdminPanel = lazy(() => import("./Pages/Admin/Panel/Panel"));
const AdminInformacionPaginaPrincipal = lazy(() => import("./Pages/Admin/InformacionPaginaPrincipal/InformacionPaginaPrincipal"));
const AdminInformacionSobreNosotros = lazy(() => import("./Pages/Admin/InformacionSobreNosotros/InformacionSobreNosotros"));
const AdminInventarioProducto = lazy(() => import("./Pages/Admin/InventarioProducto/InventarioProducto"));
const AdminPuntosVenta = lazy(() => import("./Pages/Admin/PuntosVenta/PuntosVenta"));
const AdminActivosFijos = lazy(() => import("./Pages/Admin/ActivosFijos/ActivosFijos"));
const AdminDistribucion = lazy(() => import("./Pages/Admin/Distribucion/Distribucion"));
const AdminVentasPresenciales = lazy(() => import("./Pages/Admin/VentasPresenciales/VentasPresenciales"));
const AdminVoluntariado = lazy(() => import("./Pages/Admin/Voluntariado/Voluntariado"));
const AdminUsuarios = lazy(() => import("./Pages/Admin/Usuarios/Usuarios"));
const AdminHistorialVentas = lazy(() => import("./Pages/Admin/HistorialVentas/HistorialVentas"));
const AdminAuditoria = lazy(() => import("./Pages/Admin/Auditoria/Auditoria"));
const AdminAjustes = lazy(() => import("./Pages/Admin/Ajustes/Ajustes"));
const Checkout = lazy(() => import("./Pages/Checkout/Checkout"));
const Perfil = lazy(() => import("./Pages/Perfil/Perfil"));
const HistorialComprasCliente = lazy(() => import("./Pages/HistorialCompras/HistorialComprasCliente"));
const AdminPerfil = lazy(() => import("./Pages/Admin/Perfil/AdminPerfil"));

function HomeRouteLoading() {
    return <PageLoading message="Cargando inicio..." />;
}

function SiteRouteLoading({ message = 'Cargando p\u00e1gina...' }) {
    return <PageLoading message={message} />;
}

function AdminRouteLoadingGate() {
    return <AdminRouteLoading />;
}

function getRouteLoadingMessage(pathname) {
    return getSiteBootMessage(pathname);
}

function PublicRouteOutlet() {
    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });

    return (
        <ErrorBoundary key={pathname}>
            <Outlet />
        </ErrorBoundary>
    );
}

function AdminRouteOutlet() {
    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });

    return (
        <ErrorBoundary
            key={pathname}
            message="Algo salió mal en el panel. Podés recargar o volver al inicio."
        >
            <Outlet />
        </ErrorBoundary>
    );
}

function ChromelessRouteOutlet() {
    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });
    const cacheKey = getRouteCacheKey(pathname) || pathname;
    const showLoading = usePublicPageLoadingGate(cacheKey, true);

    if (showLoading) {
        return <PageLoading message={getRouteLoadingMessage(pathname)} />;
    }

    return (
        <ErrorBoundary key={pathname}>
            <Outlet />
        </ErrorBoundary>
    );
}

function NotFoundRouteComponent() {
    useLayoutEffect(() => {
        endRouteLoading(null);
    }, []);

    return <NotFound />;
}

const rootRoute = createRootRoute({
    component: function RootLayout() {
        const pathname = useRouterState({
            select: (state) => state.location.pathname,
        });
        const cacheKey = getRouteCacheKey(pathname);
        const isHomeRoute = cacheKey === 'home';
        const isAdminRoute = pathname.startsWith("/admin");
        const isLoginRoute = pathname === "/login";
        const isPerfilRoute = pathname === "/perfil" || pathname.startsWith("/perfil/");
        const isCheckoutRoute = pathname === "/checkout";
        const isChromelessRoute = isLoginRoute || isPerfilRoute || isCheckoutRoute;
        const loadingKey = isHomeRoute ? 'home' : cacheKey || pathname;

        // Durante el render: activar overlay antes del paint (evita blanco).
        if (typeof document !== 'undefined' && !isPageInstantReady(loadingKey)) {
            beginRouteLoading(
                loadingKey,
                isAdminRoute ? 'admin' : isHomeRoute ? 'home' : 'site',
            );
        }

        useLayoutEffect(() => {
            if (isPageInstantReady(loadingKey)) {
                endRouteLoading(loadingKey);
                if (isHomeRoute) clearHomePageLoading();
                return;
            }

            const mode = isAdminRoute ? 'admin' : isHomeRoute ? 'home' : 'site';
            beginRouteLoading(loadingKey, mode);
            if (isHomeRoute) setHomePageLoading(true);
            else clearHomePageLoading();
        }, [loadingKey, isAdminRoute, isHomeRoute]);

        useEffect(() => {
            document.body.classList.toggle("admin-route-active", isAdminRoute);
            document.body.classList.toggle("perfil-route-active", isPerfilRoute);
            document.body.classList.toggle("checkout-route-active", isCheckoutRoute);
            if (isAdminRoute || isPerfilRoute || isCheckoutRoute) {
                document.body.classList.remove("home-hero-ready");
                clearHomePageLoading();
            }

            return () => {
                document.body.classList.remove("admin-route-active");
                document.body.classList.remove("perfil-route-active");
                document.body.classList.remove("checkout-route-active");
            };
        }, [isAdminRoute, isPerfilRoute, isCheckoutRoute]);

        if (isAdminRoute || isChromelessRoute) {
            return (
                <Suspense fallback={
                    isAdminRoute
                        ? <AdminRouteLoadingGate />
                        : <PageLoading message={getRouteLoadingMessage(pathname)} />
                }>
                    {isAdminRoute ? <AdminRouteOutlet /> : <ChromelessRouteOutlet />}
                </Suspense>
            );
        }

        return (
            <div className="site-shell">
                <Navbar />
                <section
                    id="center"
                    className={`site-main ${isHomeRoute ? "site-main--home" : ""}`}
                >
                    <Suspense fallback={
                        isHomeRoute
                            ? <HomeRouteLoading />
                            : <SiteRouteLoading message={getRouteLoadingMessage(pathname)} />
                    }>
                        <PublicRouteOutlet />
                    </Suspense>
                </section>
                <Footer />
                <CartAddedToast />
            </div>
        )
    },
    notFoundComponent: NotFoundRouteComponent,
})
const home = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: Home,
})
const AboutUsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/AboutUs",
    component: AboutUs,
})
const AboutUsGaleriaRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/AboutUs/galeria",
    component: AboutUs,
})
const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
    component: Login,
})
const adminPanelRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin",
    component: AdminPanel,
})
const adminInformacionPaginaPrincipalRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/informacion-pagina-principal",
    component: AdminInformacionPaginaPrincipal,
})
const adminSobreNosotrosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/sobre-nosotros",
    component: AdminInformacionSobreNosotros,
})
const adminGaleriaRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/galeria",
    component: AdminInformacionSobreNosotros,
})
const adminProductoRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/producto",
    component: AdminInventarioProducto,
})
const adminPuntosVentaRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/puntos-venta",
    component: AdminPuntosVenta,
})
const adminActivosFijosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/activos-fijos",
    component: AdminActivosFijos,
})
const adminDistribucionRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/distribucion",
    component: AdminDistribucion,
})
const adminVentasPresencialesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/ventas-presenciales",
    component: AdminVentasPresenciales,
})
const adminVoluntariadoRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/voluntariado",
    component: AdminVoluntariado,
})
const adminUsuariosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/usuarios",
    component: AdminUsuarios,
})
const adminHistorialVentasRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/historial-ventas",
    component: AdminHistorialVentas,
})
const adminAuditoriaRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/auditoria",
    component: AdminAuditoria,
})
const adminAjustesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/ajustes",
    component: AdminAjustes,
})
const adminAjustesHorariosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/ajustes/horarios",
    component: AdminAjustes,
})
const adminAjustesPermisosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/ajustes/permisos",
    component: AdminAjustes,
})
const adminAjustesIdiomaRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/ajustes/idioma",
    component: AdminAjustes,
})
const productsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/productos",
    component: Products,
})
const productDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/productos/$productId",
    component: ProductDetail,
})
const checkoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/checkout",
    component: Checkout,
})
const voluntariadoSolicitarRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/voluntariado/solicitar",
    component: SolicitarVoluntariado,
})
const perfilRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/perfil",
    component: Perfil,
})
const historialComprasClienteRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/perfil/compras",
    component: HistorialComprasCliente,
})
const adminPerfilRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/perfil",
    component: AdminPerfil,
})
const notFoundCatchAllRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/$",
    component: NotFoundRouteComponent,
})

const routeTree= rootRoute.addChildren([
    home,
    AboutUsRoute,
    AboutUsGaleriaRoute,
    loginRoute,
    adminPanelRoute,
    adminInformacionPaginaPrincipalRoute,
    adminSobreNosotrosRoute,
    adminGaleriaRoute,
    adminProductoRoute,
    adminPuntosVentaRoute,
    adminActivosFijosRoute,
    adminDistribucionRoute,
    adminVentasPresencialesRoute,
    adminHistorialVentasRoute,
    adminVoluntariadoRoute,
    adminUsuariosRoute,
    adminAuditoriaRoute,
    adminAjustesRoute,
    adminAjustesHorariosRoute,
    adminAjustesPermisosRoute,
    adminAjustesIdiomaRoute,
    productsRoute,
    productDetailRoute,
    checkoutRoute,
    voluntariadoSolicitarRoute,
    perfilRoute,
    historialComprasClienteRoute,
    adminPerfilRoute,
    notFoundCatchAllRoute,
])
export const router = createRouter({
    routeTree,
    defaultNotFoundComponent: NotFoundRouteComponent,
})
