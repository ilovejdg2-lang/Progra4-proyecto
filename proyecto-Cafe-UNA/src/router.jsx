import {
    createRootRoute,
    createRoute,
    createRouter,
    Outlet,
} from "@tanstack/react-router";

import Home from "./Pages/Home";
import AboutUs from "./Pages/AboutUs";
import Login from "./Pages/Login";
import AdminPanel from "./Pages/AdminPanel";
import Products from "./Pages/Products";
import Footer from "./Components/Footer";
import Navbar from './Components/Navbar';
import SolicitarVoluntariado from './Pages/SolicitarVoluntariado';
//import VoluntariadoMisSolicitudes from "./Pages/VoluntariadoMisSolicitudes";

const rootRoute = createRootRoute({
    component: function RootLayout() {
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
const productsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/productos",
    component: Products,
})
const voluntariadoSolicitarRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/voluntariado/solicitar",
    component: SolicitarVoluntariado,
})
/*const voluntariadoMisSolicitudesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/voluntariado/mis-solicitudes",
    component: VoluntariadoMisSolicitudes,
})*/
const routeTree= rootRoute.addChildren([
    home,
    AboutUsRoute,
    loginRoute,
    adminPanelRoute,
    productsRoute,
    voluntariadoSolicitarRoute
   // voluntariadoMisSolicitudesRoute
])
export const router = createRouter({
    routeTree
})