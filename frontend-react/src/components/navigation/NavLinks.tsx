import "./NavLinks.css";

import { NavLink, useNavigate } from "react-router-dom";

import { authSlice, useAppDispatch, useAppSelector } from "../../states";

const NavLinks: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const authData = useAppSelector((state) => state.auth.data);

    const isLoggedIn = !!authData;
    const userId = authData?.userId;

    const onLogout = () => {
        dispatch(authSlice.actions.logout());
        return navigate("/auth");
    };

    return (
        <ul className="nav-links">
            <li>
                <NavLink to="/">All users</NavLink>
            </li>
            {isLoggedIn && userId && (
                <li>
                    <NavLink to={`/${userId}/places`}>My places</NavLink>
                </li>
            )}
            {isLoggedIn && (
                <li>
                    <NavLink to="/places/new">Add place</NavLink>
                </li>
            )}
            {!isLoggedIn && (
                <li>
                    <NavLink to="/auth">Authenticate</NavLink>
                </li>
            )}
            {isLoggedIn && (
                <li>
                    <button onClick={onLogout}>LOGOUT</button>
                </li>
            )}
        </ul>
    );
};

export default NavLinks;
