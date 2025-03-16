import React, { useState, useCallback } from "react";
import {
    Route,
    Routes,
    BrowserRouter as Router,
    Navigate,
} from "react-router-dom";

import Users from "./user/pages/Users";
import Auth from "./user/pages/Auth";
import NewPlace from "./places/pages/NewPlace";
import UserPlaces from "./places/pages/UserPlaces";
import UpdatePlace from "./places/pages/UpdatePlace";
import { MainNavigation } from "./shared/components/navigation";
import { AuthContext } from "./shared/context";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const login = useCallback(() => {
        setIsLoggedIn(true);
    }, []);
    const logout = useCallback(() => {
        setIsLoggedIn(false);
    }, []);
    const context = { isLoggedIn, login, logout };

    let routes: React.JSX.Element;
    if (isLoggedIn) {
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
