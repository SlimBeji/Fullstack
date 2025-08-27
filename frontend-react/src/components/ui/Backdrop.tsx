import { createPortal } from "react-dom";

interface BackdropProps {
    onClick: () => void;
}

const Backdrop: React.FC<BackdropProps> = ({ onClick }) => {
    return createPortal(
        <div
            className="fixed top-0 left-0 w-full h-screen bg-stone-300 opacity-70 z-10"
            onClick={onClick}
        ></div>,
        document.getElementById("backdrop-hook")!
    );
};

export default Backdrop;
