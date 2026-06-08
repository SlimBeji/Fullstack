import { NavLink, useNavigate } from "react-router-dom";

import { AppRoute, userPlacesRoute } from "@/router";

import { authSlice, useAppDispatch, useAppSelector } from "../../store";

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
    const userId = authData?.user_id;

    const onLogout = () => {
        dispatch(authSlice.actions.logout());
        navigate(AppRoute.AUTH);
    };

    return (
        <ul className="links-container">
            <li>
                <NavLinkWrapper to={AppRoute.HOME}>All users</NavLinkWrapper>
            </li>
            <li>
                <NavLinkWrapper to={userPlacesRoute(userId as number)}>
                    My places
                </NavLinkWrapper>
            </li>
            <li>
                <NavLinkWrapper to={AppRoute.NEW_PLACE}>
                    Add place
                </NavLinkWrapper>
            </li>
            <li>
                <button onClick={onLogout}>LOGOUT</button>
            </li>
        </ul>
    );
};

export default NavLinks;
