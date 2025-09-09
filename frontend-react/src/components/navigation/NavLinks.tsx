import { NavLink, useNavigate } from "react-router-dom";

import { authSlice, useAppDispatch, useAppSelector } from "../../stores";

interface NavLinkWrapperProps {
    to: string;
    children: React.ReactNode;
}

const NavLinkWrapper: React.FC<NavLinkWrapperProps> = ({ to, children }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `${isActive ? "active" : ""}`}
    >
        {children}
    </NavLink>
);

const NavLinks: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const authData = useAppSelector((state) => state.auth.data);

    const isLoggedIn = !!authData;
    const userId = authData?.userId;

    const onLogout = () => {
        dispatch(authSlice.actions.logout());
        navigate("/auth");
    };

    return (
        <ul className="links-container">
            <li>
                <NavLinkWrapper to="/">All users</NavLinkWrapper>
            </li>
            {isLoggedIn && userId && (
                <li>
                    <NavLinkWrapper to={`/${userId}/places`}>
                        My places
                    </NavLinkWrapper>
                </li>
            )}
            {isLoggedIn && (
                <li>
                    <NavLinkWrapper to="/places/new">Add place</NavLinkWrapper>
                </li>
            )}
            {!isLoggedIn && (
                <li>
                    <NavLinkWrapper to="/auth">Authenticate</NavLinkWrapper>
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
