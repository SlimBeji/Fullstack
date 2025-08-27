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
                <aside
                    className="fixed top-0 left-0 z-[100] h-screen w-[70%] bg-white shadow-md"
                    onClick={onClick}
                >
                    {children}
                </aside>
            </div>
        </CSSTransition>
    );
    return createPortal(content, document.getElementById("drawer-hook")!);
};

export default SideDrawer;
