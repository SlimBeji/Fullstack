import React, { useState, useCallback, useEffect } from "react";
import {
    Route,
    Routes,
    BrowserRouter as Router,
    Navigate,
} from "react-router-dom";

import Users from "./user/pages/Users";
import Auth from "./user/pages/Auth";
import { NewPlace, UserPlaces, UpdatePlace } from "./pages";
import { MainNavigation } from "./components/navigation";
import { AuthContext } from "./stores";
import { EncodedUserToken, LocalStorageKeys } from "./types";
import { getAuthData } from "./util";

function App() {
    const [authData, setAuthData] = useState<EncodedUserToken | null>(null);

    const login = useCallback((data: EncodedUserToken) => {
        if (data) {
            setAuthData(data);
            localStorage.setItem(
                LocalStorageKeys.userData,
                JSON.stringify(data)
            );
        }
    }, []);
    const logout = useCallback(() => {
        setAuthData(null);
        localStorage.removeItem(LocalStorageKeys.userData);
    }, []);
    const context = { authData, login, logout };

    useEffect(() => {
        const data = getAuthData();
        if (data) setAuthData(data);
    }, [setAuthData]);

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
        <AuthContext.Provider value={context}>
            <Router>
                <MainNavigation />
                <main>
                    <Routes>{routes}</Routes>
                </main>
            </Router>
        </AuthContext.Provider>
    );
}

export default App;
