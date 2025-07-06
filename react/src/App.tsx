import React, { useEffect } from "react";
import {
    Route,
    Routes,
    BrowserRouter as Router,
    Navigate,
} from "react-router-dom";

import { NewPlace, UserPlaces, UpdatePlace, Users, Auth } from "./pages";
import { MainNavigation } from "./components/navigation";
import { getAuthData } from "./util";
import { authSlice, useAppDispatch, useAppSelector } from "./states";

function App() {
    const dispatch = useAppDispatch();
    const authData = useAppSelector((state) => state.auth.data);

    useEffect(() => {
        const data = getAuthData();
        if (data) dispatch(authSlice.actions.login(data));
    }, [dispatch, authSlice.actions.login]);

    let routes: React.JSX.Element;
    if (authData) {
        routes = (
            <>
                <Route path="/" element={<Users />} />
                <Route path="/:userId/places" element={<UserPlaces />} />
                <Route path="/places/new" element={<NewPlace />} />
                <Route path="/places/:placeId" element={<UpdatePlace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </>
        );
    } else {
        routes = (
            <>
                <Route path="/" element={<Users />} />
                <Route path="/:userId/places" element={<UserPlaces />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/*" element={<Navigate to="/" replace />} />
            </>
        );
    }

    return (
        <Router>
            <MainNavigation />
            <main>
                <Routes>{routes}</Routes>
            </main>
        </Router>
    );
}

export default App;
