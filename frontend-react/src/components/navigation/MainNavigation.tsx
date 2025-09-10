import React, { useState } from "react";
import { Link } from "react-router-dom";

import { useAppSelector } from "../../store";
import Backdrop from "../ui/Backdrop";
import NavLinks from "./NavLinks";
import SideDrawer from "./SideDrawer";

const MainNavigation: React.FC = () => {
    const [drawerIsOpen, setDrawerIsOpen] = useState(false);

    const authData = useAppSelector((state) => state.auth.data);
    const isLoggedIn = !!authData;

    const openDrawer = (): void => {
        setDrawerIsOpen(true);
    };

    const closeDrwaer = (): void => {
        setDrawerIsOpen(false);
    };

    return (
        <>
            {drawerIsOpen && <Backdrop onClick={closeDrwaer} />}
            <SideDrawer show={drawerIsOpen} onClick={closeDrwaer}>
                <nav className="sidedrawer">
                    <NavLinks />
                </nav>
            </SideDrawer>
            <header className="main-header">
                <div>
                    {isLoggedIn && (
                        <button className="hamburger" onClick={openDrawer}>
                            <span />
                            <span />
                            <span />
                        </button>
                    )}
                    <h1 className="app-header">
                        <Link to="/">Your Places</Link>
                    </h1>
                    {isLoggedIn && (
                        <nav className="main">
                            <NavLinks />
                        </nav>
                    )}
                </div>
            </header>
        </>
    );
};

export default MainNavigation;
