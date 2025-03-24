import React from "react";

import Modal from "./Modal";
import { Button } from "../form";

interface ErrorModelProps {
    error: string;
    header?: string;
    onClear: () => void;
}

const ErrorModal: React.FC<ErrorModelProps> = ({ error, header, onClear }) => {
    return (
        <Modal
            onCancel={onClear}
            header={header || "An Error Occurred!"}
            show={!!error}
            footer={<Button onClick={onClear}>Okay</Button>}
        >
            <p>{error}</p>
        </Modal>
    );
};

export default ErrorModal;
