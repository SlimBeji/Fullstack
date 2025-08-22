import "./AuthForm.css";

import { Card } from "../ui";

interface AuthFormProps {
    children: React.ReactNode;
}

const AuthForm: React.FC<AuthFormProps> = (props) => {
    return <Card className="authentication">{props.children}</Card>;
};

export default AuthForm;
