import "./NavLinks.css";

import { useContext } from "react";
import { NavLink, useMatch, redirect } from "react-router-dom";

import { AuthContext } from "../../context";

const NavLinks: React.FC = () => {
    const auth = useContext(AuthContext);
    const match = useMatch("/:userId/places");
    const userId = match?.params?.userId;

    const onLogout = () => {
        auth.logout();
        return redirect("/auth");
    };

    return (
        <ul className="nav-links">
            <li>
                <NavLink to="/">All users</NavLink>
            </li>
            {auth.isLoggedIn && (
                <li>
                    <NavLink
                        to={userId ? `/${userId}/places` : "/1/places"}
                        className={userId ? "active" : ""}
                    >
                        My places
                    </NavLink>
                </li>
            )}
            {auth.isLoggedIn && (
                <li>
                    <NavLink to="/places/new">Add place</NavLink>
                </li>
            )}
            {!auth.isLoggedIn && (
                <li>
                    <NavLink to="/auth">Authenticate</NavLink>
                </li>
            )}
            {auth.isLoggedIn && (
                <li>
                    <button onClick={onLogout}>LOGOUT</button>
                </li>
            )}
        </ul>
    );
};

export default NavLinks;
