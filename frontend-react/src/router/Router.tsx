import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { Auth, NewPlace, UpdatePlace, UserPlaces, Users } from "@/pages";
import { getAuthData } from "@/storage";
import { authSlice, useAppDispatch, useAppSelector } from "@/store";

import { AppRoute } from "./routes";

const route = (
    path: string,
    component: React.ReactNode,
    active: boolean = true,
    alt: string = AppRoute.HOME
) => {
    return (
        <Route
            path={path}
            element={active ? component : <Navigate to={alt} replace />}
        />
    );
};

const Router: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const authData = useAppSelector((state) => state.auth.data);

    useEffect(() => {
        const data = getAuthData();
        if (data) dispatch(authSlice.actions.setAuthData(data));
    }, [dispatch]);

    useEffect(() => {
        if (!authData) {
            navigate(AppRoute.AUTH);
        }
    }, [authData, navigate]);

    return (
        <main>
            <Routes>
                {/* Unauthenticated Routes */}
                {route(AppRoute.AUTH, <Auth />, !authData, AppRoute.HOME)}

                {/* Auth required Routes */}
                {route(AppRoute.HOME, <Users />, !!authData, AppRoute.AUTH)}
                {route(
                    AppRoute.USER_PLACES,
                    <UserPlaces />,
                    !!authData,
                    AppRoute.AUTH
                )}
                {route(
                    AppRoute.NEW_PLACE,
                    <NewPlace />,
                    !!authData,
                    AppRoute.AUTH
                )}
                {route(
                    AppRoute.UPDATE_PLACE,
                    <UpdatePlace />,
                    !!authData,
                    AppRoute.AUTH
                )}

                {/* Default Route */}
                {route(AppRoute.ANY, <Navigate to={AppRoute.HOME} replace />)}
            </Routes>
        </main>
    );
};

export default Router;
