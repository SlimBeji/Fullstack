import { Transition } from "@headlessui/react";
import type { ReactNode } from "react";
import { Fragment, useRef } from "react";
import { createPortal } from "react-dom";

import type { FormSubmitHandler } from "@/types";

import Backdrop from "./Backdrop";
import styles from "./Modal.module.css";

interface ModalOverlayProps {
    children: ReactNode;
    header: string;
    footer: ReactNode;
    onSubmit?: FormSubmitHandler;
    style?: React.CSSProperties;
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
        <div ref={ref} className={styles["modal-container"]} style={style}>
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
                enter={styles["modal effect"]}
                enterFrom={styles["modal a"]}
                enterTo={styles["modal b"]}
                leave={styles["modal effect"]}
                leaveFrom={styles["modal b"]}
                leaveTo={styles["modal a"]}
            >
                <ModalOverlay ref={nodeRef} {...overlayProps}></ModalOverlay>
            </Transition>
        </>
    );
};

export default Modal;
