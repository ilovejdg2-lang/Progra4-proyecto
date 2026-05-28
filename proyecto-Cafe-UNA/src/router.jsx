import {
    createRootRoute,
    createRoute,
    createRouter,
    Outlet,
    useRouterState,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

import Footer from "./Components/Footer/Footer";
import Navbar from './Components/Navbar/Navbar';
import PageLoading from "./Components/PageLoading/PageLoading";

const Home = lazy(() => import("./Pages/Home/Home"));
const AboutUs = lazy(() => import("./Pages/AboutUs/AboutUs"));
const Login = lazy(() => import("./Pages/Login/Login"));
const AdminPanel = lazy(() => import("./Pages/Admin/Panel/Panel"));
const AdminInformacionPaginaPrincipal = lazy(() => import("./Pages/Admin/InformacionPaginaPrincipal/InformacionPaginaPrincipal"));
const AdminInformacionSobreNosotros = lazy(() => import("./Pages/Admin/InformacionSobreNosotros/InformacionSobreNosotros"));
const AdminInventarioProducto = lazy(() => import("./Pages/Admin/InventarioProducto/InventarioProducto"));
const AdminVoluntariado = lazy(() => import("./Pages/Admin/Voluntariado/Voluntariado"));
const AdminUsuarios = lazy(() => import("./Pages/Admin/Usuarios/Usuarios"));
const Products = lazy(() => import("./Pages/Products/Products"));
const Checkout = lazy(() => import("./Pages/Checkout/Checkout"));
const SolicitarVoluntariado = lazy(() => import("./Pages/Voluntariado/SolicitarVoluntariado"));

const CHROME_GATED_PUBLIC_ROUTES = new Set([
    "/",
    "/AboutUs",
    "/productos",
    "/voluntariado/solicitar",
]);

const rootRoute = createRootRoute({
    component: function RootLayout() {
        const pathname = useRouterState({
            select: (state) => state.location.pathname,
        });
        const isAdminRoute = pathname.startsWith("/admin");
        const isLoginRoute = pathname === "/login";
        const isHomeRoute = pathname === "/";
        const isChromeGatedRoute = CHROME_GATED_PUBLIC_ROUTES.has(pathname);
        const [publicRouteReady, setPublicRouteReady] = useState(!isChromeGatedRoute);

        useEffect(() => {
            if (!isChromeGatedRoute) {
                setPublicRouteReady(true);
                return undefined;
            }

            setPublicRouteReady(false);
            const handlePublicRouteReady = (event) => {
                if (event?.detail?.pathname === pathname) {
                    setPublicRouteReady(true);
                }
            };
            window.addEventListener("public-route-ready", handlePublicRouteReady);

            return () => {
                window.removeEventListener("public-route-ready", handlePublicRouteReady);
            };
        }, [isChromeGatedRoute, pathname]);

        if (isAdminRoute || isLoginRoute) {
            return (
                <Suspense fallback={<PageLoading />}>
                    <Outlet />
                </Suspense>
            );
        }

        return (
            <div className="site-shell">
                {isChromeGatedRoute && !publicRouteReady ? null : <Navbar />}
                <section id="center" className={`site-main ${pathname === "/" ? "site-main--home" : ""}`}>
                    <Suspense fallback={<PageLoading />}>
                        <Outlet />
                    </Suspense>
                </section>
                {isChromeGatedRoute && !publicRouteReady ? null : <Footer />}
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
    checkoutRoute,
    voluntariadoSolicitarRoute
   // voluntariadoMisSolicitudesRoute
])
export const router = createRouter({
    routeTree
})