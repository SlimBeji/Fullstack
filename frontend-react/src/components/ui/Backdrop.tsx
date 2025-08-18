import "./Backdrop.css";

import { createPortal } from "react-dom";

interface BackdropProps {
    onClick: () => void;
}

const Backdrop: React.FC<BackdropProps> = ({ onClick }) => {
    return createPortal(
        <div className="backdrop" onClick={onClick}></div>,
        document.getElementById("backdrop-hook")!
    );
};

export default Backdrop;
