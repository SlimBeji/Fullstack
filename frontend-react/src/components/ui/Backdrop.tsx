import { createPortal } from "react-dom";

import styles from "./Backdrop.module.css";

interface BackdropProps {
    onClick: () => void;
}

const Backdrop: React.FC<BackdropProps> = ({ onClick }) => {
    return createPortal(
        <div className={styles["modal-backdrop"]} onClick={onClick}></div>,
        document.getElementById("backdrop-hook")!
    );
};

export default Backdrop;
