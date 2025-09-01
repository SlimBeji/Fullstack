import { NavLink, useNavigate } from "react-router-dom";

import { authSlice, useAppDispatch, useAppSelector } from "../../states";

interface NavLinkWrapperProps {
    to: string;
    children: React.ReactNode;
}

const NavLinkWrapper: React.FC<NavLinkWrapperProps> = ({ to, children }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `
                border no-underline px-2 py-1 font-inherit hover:bg-[#f8df00] hover:border-[#292929] hover:text-[#292929] 
            ${
                isActive
                    ? "bg-[#f8df00] border-[#292929] text-[#292929]"
                    : "text-black md:text-white border-transparent"
            }
            `
        }
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
        <ul className="list-none m-0 p-0 w-full h-full flex flex-col justify-center items-center md:flex-row">
            <li className="m-4 md:mx-2 md:my-0">
                <NavLinkWrapper to="/">All users</NavLinkWrapper>
            </li>
            {isLoggedIn && userId && (
                <li className="m-4 md:mx-2 md:my-0">
                    <NavLinkWrapper to={`/${userId}/places`}>
                        My places
                    </NavLinkWrapper>
                </li>
            )}
            {isLoggedIn && (
                <li className="m-4 md:mx-2 md:my-0">
                    <NavLinkWrapper to="/places/new">Add place</NavLinkWrapper>
                </li>
            )}
            {!isLoggedIn && (
                <li className="m-4 md:mx-2 md:my-0">
                    <NavLinkWrapper to="/auth">Authenticate</NavLinkWrapper>
                </li>
            )}
            {isLoggedIn && (
                <li className="m-4 md:mx-2 md:my-0">
                    <button
                        onClick={onLogout}
                        className="cursor-pointer border border-[#292929] text-[#292929] bg-transparent px-2 py-1 font-inherit hover:bg-[#f8df00] hover:text-[#292929] md:border-white md:text-white md:hover:bg-[#f8df00] md:hover:text-[#292929]"
                    >
                        LOGOUT
                    </button>
                </li>
            )}
        </ul>
    );
};

export default NavLinks;
