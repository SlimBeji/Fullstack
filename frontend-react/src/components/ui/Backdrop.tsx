import { createPortal } from "react-dom";

interface BackdropProps {
    onClick: () => void;
}

const Backdrop: React.FC<BackdropProps> = ({ onClick }) => {
    return createPortal(
        <div className="modal-backdrop" onClick={onClick}></div>,
        document.getElementById("backdrop-hook")!
    );
};

export default Backdrop;
