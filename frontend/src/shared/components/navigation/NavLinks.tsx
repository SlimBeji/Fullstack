import "./NavLinks.css";

import { useContext } from "react";
import { NavLink, redirect } from "react-router-dom";

import { AuthContext } from "../../context";

const NavLinks: React.FC = () => {
    const auth = useContext(AuthContext);
    const userId = auth.userId;

    const onLogout = () => {
        auth.logout();
        return redirect("/auth");
    };

    return (
        <ul className="nav-links">
            <li>
                <NavLink to="/">All users</NavLink>
            </li>
            {auth.isLoggedIn && userId && (
                <li>
                    <NavLink to={`/${userId}/places`}>My places</NavLink>
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
