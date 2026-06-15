import React, { useState } from "react";
import { Link } from "react-router-dom";

import { AppRoute } from "@/router";

import { useAppSelector } from "../../store";
import Backdrop from "../ui/Backdrop";
import styles from "./MainNavigation.module.css";
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
                <nav className={styles["sidedrawer"]}>
                    <NavLinks />
                </nav>
            </SideDrawer>
            <header className={styles["main-header"]}>
                <div>
                    {isLoggedIn && (
                        <button
                            className={styles["hamburger"]}
                            onClick={openDrawer}
                        >
                            <span />
                            <span />
                            <span />
                        </button>
                    )}
                    <h1 className={styles["app-header"]}>
                        <Link to={AppRoute.HOME}>Your Places</Link>
                    </h1>
                    {isLoggedIn && (
                        <nav className={styles["main"]}>
                            <NavLinks />
                        </nav>
                    )}
                </div>
            </header>
        </>
    );
};

export default MainNavigation;
