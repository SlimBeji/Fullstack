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
        <React.Fragment>
            {drawerIsOpen && <Backdrop onClick={closeDrwaer} />}
            <SideDrawer show={drawerIsOpen} onClick={closeDrwaer}>
                <nav className="h-full">
                    <NavLinks />
                </nav>
            </SideDrawer>
            <MainHeader>
                <button
                    className="w-12 h-12 bg-transparent border-none flex flex-col justify-around mr-8 cursor-pointer md:hidden"
                    onClick={openDrawer}
                >
                    <span className="block w-12 h-[2.5px] bg-white" />
                    <span className="block w-12 h-[2.5px] bg-white" />
                    <span className="block w-12 h-[2.5px] bg-white" />
                </button>
                <h1 className="text-white">
                    <Link to="/">YourPlaces</Link>
                </h1>
                <nav className="hidden md:block">
                    <NavLinks />
                </nav>
            </MainHeader>
        </React.Fragment>
    );
};

export default MainNavigation;
