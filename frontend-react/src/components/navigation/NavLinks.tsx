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
        navigate("/auth");
    };

    // Styling section
    const navLinkBase =
        "border no-underline px-2 py-1 font-inherit hover:bg-[#f8df00] hover:border-[#292929] hover:text-[#292929]";
    const navLinkInactive = "text-black md:text-white border-transparent";
    const navLinkActive = "bg-[#f8df00] border-[#292929] text-[#292929]";
    const navLinkClasses = (props: { isActive: boolean }) => {
        return `${navLinkBase} ${props.isActive ? navLinkActive : navLinkInactive}`;
    };
    const buttonClasses =
        "cursor-pointer border border-[#292929] text-[#292929] bg-transparent px-2 py-1 font-inherit hover:bg-[#f8df00] hover:text-[#292929] md:border-white md:text-white md:hover:bg-[#f8df00] md:hover:text-[#292929]";

    // JSX section
    return (
        <ul className="list-none m-0 p-0 w-full h-full flex flex-col justify-center items-center md:flex-row">
            <li className="m-4 md:mx-2 md:my-0">
                <NavLink to="/" className={navLinkClasses}>
                    All users
                </NavLink>
            </li>
            {isLoggedIn && userId && (
                <li className="m-4 md:mx-2 md:my-0">
                    <NavLink
                        to={`/${userId}/places`}
                        className={navLinkClasses}
                    >
                        My places
                    </NavLink>
                </li>
            )}
            {isLoggedIn && (
                <li className="m-4 md:mx-2 md:my-0">
                    <NavLink to="/places/new" className={navLinkClasses}>
                        Add place
                    </NavLink>
                </li>
            )}
            {!isLoggedIn && (
                <li className="m-4 md:mx-2 md:my-0">
                    <NavLink to="/auth" className={navLinkClasses}>
                        Authenticate
                    </NavLink>
                </li>
            )}
            {isLoggedIn && (
                <li className="m-4 md:mx-2 md:my-0">
                    <button onClick={onLogout} className={buttonClasses}>
                        LOGOUT
                    </button>
                </li>
            )}
        </ul>
    );
};

export default NavLinks;
