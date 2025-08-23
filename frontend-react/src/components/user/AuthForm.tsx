interface AuthFormProps {
    children: React.ReactNode;
}

const AuthForm: React.FC<AuthFormProps> = (props) => {
    const style =
        "w-[90%] max-w-md mx-auto mt-10 text-center p-6 shadow-lg rounded-xl bg-white";

    return <div className={style}>{props.children}</div>;
};

export default AuthForm;
