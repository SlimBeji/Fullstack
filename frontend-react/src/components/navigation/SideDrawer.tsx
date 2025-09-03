import { Transition } from "@headlessui/react";
import { ReactNode, useRef } from "react";
import { createPortal } from "react-dom";

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
            enter="sidedrawer effect"
            enterFrom="sidedrawer a"
            enterTo="sidedrawer b"
            leave="sidedrawer effect"
            leaveFrom="sidedrawer b"
            leaveTo="sidedrawer a"
            as="div"
            ref={nodeRef}
        >
            <div ref={nodeRef}>
                <aside className="sidedrawer" onClick={onClick}>
                    {children}
                </aside>
            </div>
        </Transition>
    );
    return createPortal(content, document.getElementById("drawer-hook")!);
};

export default SideDrawer;
