import { Transition } from "@headlessui/react";
import type { ReactNode } from "react";
import { useRef } from "react";
import { createPortal } from "react-dom";

import styles from "./SideDrawer.module.css";

interface SideDrawerProps {
    show: boolean;
    children?: ReactNode;
    onClick: () => void;
}

const SideDrawer: React.FC<SideDrawerProps> = ({ show, children, onClick }) => {
    const nodeRef = useRef(null);
    const content = (
        <Transition
            show={show}
            enter={styles["sidedrawer effect"]}
            enterFrom={styles["sidedrawer a"]}
            enterTo={styles["sidedrawer b"]}
            leave={styles["sidedrawer effect"]}
            leaveFrom={styles["sidedrawer b"]}
            leaveTo={styles["sidedrawer a"]}
            as="div"
            ref={nodeRef}
        >
            <div ref={nodeRef}>
                <aside className={styles["sidedrawer"]} onClick={onClick}>
                    {children}
                </aside>
            </div>
        </Transition>
    );
    return createPortal(content, document.getElementById("drawer-hook")!);
};

export default SideDrawer;
