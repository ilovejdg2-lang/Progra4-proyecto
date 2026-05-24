import {
    createRootRoute,
    createRoute,
    createRouter,
    Outlet,
    useRouterState,
} from "@tanstack/react-router";

import Home from "./Pages/Home/Home";
import AboutUs from "./Pages/AboutUs/AboutUs";
import Login from "./Pages/Login/Login";
import AdminPanel from "./Pages/Admin/Panel";
import AdminInformacionPaginaPrincipal from "./Pages/Admin/InformacionPaginaPrincipal";
import AdminInformacionSobreNosotros from "./Pages/Admin/InformacionSobreNosotros";
import AdminInventarioProducto from "./Pages/Admin/InventarioProducto";
import AdminVoluntariado from "./Pages/Admin/Voluntariado";
import AdminUsuarios from "./Pages/Admin/Usuarios";
import Products from "./Pages/Products/Products";
import Checkout from "./Pages/Products/Checkout";
import Footer from "./Components/Footer/Footer";
import Navbar from './Components/Navbar/Navbar';
import SolicitarVoluntariado from './Pages/Voluntariado/SolicitarVoluntariado';


const rootRoute = createRootRoute({
    component: function RootLayout() {
        const pathname = useRouterState({
            select: (state) => state.location.pathname,
        });
        const isAdminRoute = pathname.startsWith("/admin");
        const isLoginRoute = pathname === "/login";

        if (isAdminRoute || isLoginRoute) {
            return <Outlet />;
        }

        return (
            <>
                <Navbar />
              <section id="center">
                <Outlet />
              </section>
                <Footer />
            </>
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
