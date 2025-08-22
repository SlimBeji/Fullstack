import React, { useEffect } from "react";
import {
    BrowserRouter as Router,
    Navigate,
    Route,
    Routes,
    useNavigate,
} from "react-router-dom";

import { MainNavigation } from "./components/navigation";
import { Auth, NewPlace, UpdatePlace, UserPlaces, Users } from "./pages";
import { authSlice, useAppDispatch, useAppSelector } from "./states";
import { getAuthData } from "./util";

const route = (
    path: string,
    component: React.ReactNode,
    active: boolean = true,
    alt: string = "/"
) => {
    return (
        <Route
            path={path}
            element={active ? component : <Navigate to={alt} replace />}
        />
    );
};

const AppRoutes: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const authData = useAppSelector((state) => state.auth.data);

    useEffect(() => {
        const data = getAuthData();
        if (data) dispatch(authSlice.actions.setAuthData(data));
    }, [dispatch]);

    useEffect(() => {
        if (!authData) {
            navigate("/auth");
        }
    }, [authData, navigate]);

    return (
        <main>
            <Routes>
                {/* Unauthenticated Routes */}
                {route("/auth", <Auth />, !authData, "/")}

                {/* Auth required Routes */}
                {route("/places/new", <NewPlace />, !!authData, "/auth")}
                {route(
                    "/places/:placeId",
                    <UpdatePlace />,
                    !!authData,
                    "/auth"
                )}

                {/* Public Routes */}
                {route("/:userId/places", <UserPlaces />)}
                {route("/", <Users />)}

                {/* Default Route */}
                {route("*", <Navigate to="/" replace />)}
            </Routes>
        </main>
    );
};

function App() {
    return (
        <Router>
            <MainNavigation />
            <AppRoutes />
        </Router>
    );
}

export default App;
