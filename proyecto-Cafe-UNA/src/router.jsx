import {
    createRootRoute,
    createRoute,
    createRouter,
    Outlet,
} from "@tanstack/react-router";

import Home from "./Pages/Home";
import AboutUs from "./Pages/AboutUs";
import Footer from "./Components/Footer";
import Navbar from './Components/Navbar';

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
const routeTree= rootRoute.addChildren([
    home,
    AboutUsRoute
])
export const router = createRouter({
    routeTree
})