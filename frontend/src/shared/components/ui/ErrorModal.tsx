import React from "react";

import Modal from "./Modal";
import { Button } from "../form";

interface ErrorModelProps {
    error: string;
    onClear: () => void;
}

const ErrorModal: React.FC<ErrorModelProps> = ({ error, onClear }) => {
    return (
        <Modal
            onCancel={onClear}
            header="An Error Occurred!"
            show={!!error}
            footer={<Button onClick={onClear}>Okay</Button>}
        >
            <p>{error}</p>
        </Modal>
    );
};

export default ErrorModal;
