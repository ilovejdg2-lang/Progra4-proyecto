/* eslint-disable react-refresh/only-export-components */
import {
    createRootRoute,
    createRoute,
    createRouter,
    Outlet,
    useRouterState,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect } from "react";

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
const Perfil = lazy(() => import("./Pages/Perfil/Perfil"));
const AdminPerfil = lazy(() => import("./Pages/Admin/Perfil/AdminPerfil"));

function AdminRouteLoading() {
    return (
        <div className="admin-route-loading" role="status" aria-live="polite">
            <span className="admin-route-loading__spinner" aria-hidden="true" />
            <p>Cargando panel administrativo...</p>
        </div>
    );
}

const rootRoute = createRootRoute({
    component: function RootLayout() {
        const pathname = useRouterState({
            select: (state) => state.location.pathname,
        });
        const isAdminRoute = pathname.startsWith("/admin");
        const isLoginRoute = pathname === "/login";
        const isPerfilRoute = pathname === "/perfil";

        useEffect(() => {
            document.body.classList.toggle("admin-route-active", isAdminRoute);
            document.body.classList.toggle("perfil-route-active", isPerfilRoute);
            if (isAdminRoute || isPerfilRoute) {
                document.body.classList.remove("app-route-loading", "home-hero-ready");
            }

            return () => {
                document.body.classList.remove("admin-route-active");
                document.body.classList.remove("perfil-route-active");
            };
        }, [isAdminRoute, isPerfilRoute]);

        if (isAdminRoute || isLoginRoute || isPerfilRoute) {
            return (
                <Suspense fallback={isAdminRoute ? <AdminRouteLoading /> : <PageLoading />}>
                    <Outlet />
                </Suspense>
            );
        }

        return (
            <div className="site-shell">
                <Navbar />
                <section
                    id="center"
                    className={`site-main ${pathname === "/" ? "site-main--home" : ""}`}
                >
                    <Suspense fallback={<PageLoading />}>
                        <Outlet />
                    </Suspense>
                </section>
                <Footer />
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
    checkoutRoute,
    voluntariadoSolicitarRoute,
    perfilRoute,
    adminPerfilRoute
   // voluntariadoMisSolicitudesRoute
])
export const router = createRouter({
    routeTree
})