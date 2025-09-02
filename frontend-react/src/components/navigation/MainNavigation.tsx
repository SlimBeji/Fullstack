import React, { useState } from "react";
import { Link } from "react-router-dom";

import Backdrop from "../ui/Backdrop";
import MainHeader from "./MainHeader";
import NavLinks from "./NavLinks";
import SideDrawer from "./SideDrawer";

const MainNavigation: React.FC = () => {
    const [drawerIsOpen, setDrawerIsOpen] = useState(false);

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
            <MainHeader>
                <button className="hamburger" onClick={openDrawer}>
                    <span />
                    <span />
                    <span />
                </button>
                <h1 className="app-header">
                    <Link to="/">YourPlaces</Link>
                </h1>
                <nav className="main">
                    <NavLinks />
                </nav>
            </MainHeader>
        </>
    );
};

export default MainNavigation;
