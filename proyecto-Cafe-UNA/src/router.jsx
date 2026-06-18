/* eslint-disable react-refresh/only-export-components */
import {
    createRootRoute,
    createRoute,
    createRouter,
    Outlet,
    useRouterState,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useLayoutEffect } from "react";

import AdminRouteLoading from "./Components/Admin/AdminRouteLoading";
import CartAddedToast from "./Components/CartAddedToast/CartAddedToast";
import Footer from "./Components/Footer/Footer";
import Navbar from './Components/Navbar/Navbar';
import PageLoading from "./Components/PageLoading/PageLoading";
import Home from "./Pages/Home/Home";
import { getRouteCacheKey, isPageInstantReady } from "./lib/pageSessionState";
import { clearHomePageLoading, setHomePageLoading } from "./lib/homePageLoading";
import { finishAdminBootLoading, finishSiteBootLoading, getSiteBootMessage } from "./lib/siteBootLoading";

const AboutUs = lazy(() => import("./Pages/AboutUs/AboutUs"));
const Products = lazy(() => import("./Pages/Products/Products"));
const ProductDetail = lazy(() => import("./Pages/ProductDetail/ProductDetail"));
const SolicitarVoluntariado = lazy(() => import("./Pages/Voluntariado/SolicitarVoluntariado"));
const Login = lazy(() => import("./Pages/Login/Login"));
const AdminPanel = lazy(() => import("./Pages/Admin/Panel/Panel"));
const AdminInformacionPaginaPrincipal = lazy(() => import("./Pages/Admin/InformacionPaginaPrincipal/InformacionPaginaPrincipal"));
const AdminInformacionSobreNosotros = lazy(() => import("./Pages/Admin/InformacionSobreNosotros/InformacionSobreNosotros"));
const AdminInventarioProducto = lazy(() => import("./Pages/Admin/InventarioProducto/InventarioProducto"));
const AdminVoluntariado = lazy(() => import("./Pages/Admin/Voluntariado/Voluntariado"));
const AdminUsuarios = lazy(() => import("./Pages/Admin/Usuarios/Usuarios"));
const Checkout = lazy(() => import("./Pages/Checkout/Checkout"));
const Perfil = lazy(() => import("./Pages/Perfil/Perfil"));
const AdminPerfil = lazy(() => import("./Pages/Admin/Perfil/AdminPerfil"));

function HomeRouteLoading() {
    if (isPageInstantReady('home')) {
        return null;
    }

    return <PageLoading message="Cargando inicio..." />;
}

function SiteRouteLoading({ message = 'Cargando página...', cacheKey }) {
    if (cacheKey && isPageInstantReady(cacheKey)) {
        return null;
    }

    return <PageLoading message={message} />;
}

function AdminRouteLoadingGate({ cacheKey }) {
    if (cacheKey && isPageInstantReady(cacheKey)) {
        return null;
    }

    return <AdminRouteLoading />;
}

function getRouteLoadingMessage(pathname) {
    return getSiteBootMessage(pathname);
}

function PublicRouteOutlet() {
    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });
    const cacheKey = getRouteCacheKey(pathname);
    const isHomeRoute = cacheKey === 'home';

    useLayoutEffect(() => {
        const key = isHomeRoute ? 'home' : cacheKey;
        if (key && !isPageInstantReady(key)) return;
        finishSiteBootLoading();
    }, [cacheKey, isHomeRoute]);

    return <Outlet />;
}

function AdminRouteOutlet() {
    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });
    const cacheKey = getRouteCacheKey(pathname);

    useLayoutEffect(() => {
        if (cacheKey && !isPageInstantReady(cacheKey)) return;
        finishAdminBootLoading();
    }, [cacheKey]);

    return <Outlet />;
}

function ChromelessRouteOutlet() {
    useLayoutEffect(() => {
        finishSiteBootLoading();
    }, []);

    return <Outlet />;
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
        const isPerfilRoute = pathname === "/perfil";

        useLayoutEffect(() => {
            if (!isHomeRoute) {
                clearHomePageLoading();
                return;
            }

            if (isPageInstantReady('home')) {
                clearHomePageLoading();
            } else {
                setHomePageLoading(true);
            }
        }, [isHomeRoute]);

        useEffect(() => {
            document.body.classList.toggle("admin-route-active", isAdminRoute);
            document.body.classList.toggle("perfil-route-active", isPerfilRoute);
            if (isAdminRoute || isPerfilRoute) {
                document.body.classList.remove("app-route-loading", "home-hero-ready");
                clearHomePageLoading();
            }

            return () => {
                document.body.classList.remove("admin-route-active");
                document.body.classList.remove("perfil-route-active");
            };
        }, [isAdminRoute, isPerfilRoute]);

        if (isAdminRoute || isLoginRoute || isPerfilRoute) {
            return (
                <Suspense fallback={
                    isAdminRoute
                        ? <AdminRouteLoadingGate cacheKey={cacheKey} />
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
                            : <SiteRouteLoading message={getRouteLoadingMessage(pathname)} cacheKey={cacheKey} />
                    }>
                        <PublicRouteOutlet />
                    </Suspense>
                </section>
                <Footer />
                <CartAddedToast />
            </div>
        )
    },
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
const adminProductoRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/producto",
    component: AdminInventarioProducto,
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
const adminPerfilRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/perfil",
    component: AdminPerfil,
})




const routeTree= rootRoute.addChildren([
    home,
    AboutUsRoute,
    loginRoute,
    adminPanelRoute,
    adminInformacionPaginaPrincipalRoute,
    adminSobreNosotrosRoute,
    adminProductoRoute,
    adminVoluntariadoRoute,
    adminUsuariosRoute,
    productsRoute,
    productDetailRoute,
    checkoutRoute,
    voluntariadoSolicitarRoute,
    perfilRoute,
    adminPerfilRoute
   // voluntariadoMisSolicitudesRoute
])
export const router = createRouter({
    routeTree
})
