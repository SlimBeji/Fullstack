import { ReactNode, useRef } from "react";
import { createPortal } from "react-dom";
import { CSSTransition } from "react-transition-group";

import "./Modal.css";

import Backdrop from "./Backdrop";
import { FormSubmitHandler } from "../../types";

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
    const content = (
        <div ref={ref} className={`modal ${className}`} style={style}>
            <header className={`modal__header ${headerClass}`}>
                <h2>{header}</h2>
            </header>
            <form onSubmit={onSubmit ? onSubmit : (e) => e.preventDefault()}>
                <div className={`modal__content ${contentClass}`}>
                    {children}
                </div>
                <footer className={`modal__footer ${footerClass}`}>
                    {footer}
                </footer>
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
            <CSSTransition
                in={show}
                timeout={200}
                classNames="modal"
                nodeRef={nodeRef}
                mountOnEnter
                unmountOnExit
            >
                <ModalOverlay ref={nodeRef} {...overlayProps}></ModalOverlay>
            </CSSTransition>
        </>
    );
};

export default Modal;
