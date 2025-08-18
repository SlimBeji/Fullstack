import "./SideDrawer.css";

import { ReactNode, useRef } from "react";
import { createPortal } from "react-dom";
import { CSSTransition } from "react-transition-group";

interface SideDrawerProps {
    show: boolean;
    children?: ReactNode;
    onClick: () => void;
}

const SideDrawer: React.FC<SideDrawerProps> = ({ show, children, onClick }) => {
    const nodeRef = useRef(null);
    const content = (
        <CSSTransition
            in={show}
            timeout={200}
            classNames="slide-in-left"
            nodeRef={nodeRef}
            mountOnEnter
            unmountOnExit
        >
            <div ref={nodeRef}>
                <aside className="side-drawer" onClick={onClick}>
                    {children}
                </aside>
            </div>
        </CSSTransition>
    );
    return createPortal(content, document.getElementById("drawer-hook")!);
};

export default SideDrawer;
