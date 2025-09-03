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
    style,
    ref,
}) => {
    const content = (
        <div ref={ref} className="modal-container" style={style}>
            <header>
                <h2>{header}</h2>
            </header>
            <form onSubmit={onSubmit ? onSubmit : (e) => e.preventDefault()}>
                <div>{children}</div>
                <footer>{footer}</footer>
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
                enter="modal effect"
                enterFrom="modal a"
                enterTo="modal b"
                leave="modal effect"
                leaveFrom="modal b"
                leaveTo="modal a"
            >
                <ModalOverlay ref={nodeRef} {...overlayProps}></ModalOverlay>
            </Transition>
        </>
    );
};

export default Modal;
