import { Transition } from "@headlessui/react";
import { Fragment, ReactNode, useRef } from "react";
import { createPortal } from "react-dom";

import { FormSubmitHandler } from "../../types";
import Backdrop from "./Backdrop";

interface ModalOverlayProps {
    children: ReactNode;
    header: string;
    footer: ReactNode;
    onSubmit?: FormSubmitHandler;
    className?: string;
    style?: React.CSSProperties;
    headerClass?: string;
    contentClass?: string;
    footerClass?: string;
    ref?: React.RefObject<HTMLDivElement | null>;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({
    children,
    header,
    footer,
    onSubmit,
    className,
    style,
    headerClass,
    contentClass,
    footerClass,
    ref,
}) => {
    const wrapperClasses =
        "fixed top-[22vh] left-[10%] w-[80%] bg-white rounded-lg shadow-lg z-50 md:left-1/2 md:w-[40rem] md:-translate-x-1/2";
    const headerClasses = "w-full p-4 bg-indigo-900 text-white";

    const content = (
        <div
            ref={ref}
            className={`${wrapperClasses} ${className}`}
            style={style}
        >
            <header className={`${headerClasses} ${headerClass}`}>
                <h2 className="m-2 text-xl font-semibold">{header}</h2>
            </header>
            <form onSubmit={onSubmit ? onSubmit : (e) => e.preventDefault()}>
                <div className={`p-4 ${contentClass}`}>{children}</div>
                <footer className={`p-4 ${footerClass}`}>{footer}</footer>
            </form>
        </div>
    );
    return createPortal(content, document.getElementById("modal-hook")!);
};

interface ModalProps extends ModalOverlayProps {
    show: boolean;
    onCancel: () => void;
}

const Modal: React.FC<ModalProps> = ({ show, onCancel, ...overlayProps }) => {
    const nodeRef = useRef<HTMLDivElement | null>(null);
    return (
        <>
            {show && <Backdrop onClick={onCancel} />}
            <Transition
                as={Fragment}
                show={show}
                enter="transition-all duration-300 ease-out transform"
                enterFrom="opacity-0 -translate-y-20"
                enterTo="opacity-100 translate-y-0"
                leave="transition-all transform"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 -translate-y-[100vh] duration-500 ease-in"
            >
                <ModalOverlay ref={nodeRef} {...overlayProps}></ModalOverlay>
            </Transition>
        </>
    );
};

export default Modal;
