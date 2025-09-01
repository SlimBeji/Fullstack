interface AuthFormProps {
    children: React.ReactNode;
}

const AuthForm: React.FC<AuthFormProps> = (props) => {
    return (
        <div className="w-[90%] max-w-md mx-auto mt-10 text-center p-6 shadow-lg rounded-xl bg-white">
            {props.children}
        </div>
    );
};

export default AuthForm;
