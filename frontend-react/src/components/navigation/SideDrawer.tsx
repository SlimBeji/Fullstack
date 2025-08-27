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
            enter="transform transition duration-200"
            enterFrom="-translate-x-full opacity-0"
            enterTo="translate-x-0 opacity-100"
            leave="transform transition duration-200"
            leaveFrom="translate-x-0 opacity-100"
            leaveTo="-translate-x-full opacity-0"
            as="div"
            ref={nodeRef}
        >
            <div ref={nodeRef}>
                <aside
                    className="fixed top-0 left-0 z-[100] h-screen w-[70%] bg-white shadow-md"
                    onClick={onClick}
                >
                    {children}
                </aside>
            </div>
        </Transition>
    );
    return createPortal(content, document.getElementById("drawer-hook")!);
};

export default SideDrawer;
