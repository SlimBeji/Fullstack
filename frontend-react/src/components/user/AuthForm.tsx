interface AuthFormProps {
    children: React.ReactNode;
}

const AuthForm: React.FC<AuthFormProps> = (props) => {
    return <div className="auth-form">{props.children}</div>;
};

export default AuthForm;
