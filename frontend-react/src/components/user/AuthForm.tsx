import { Card } from "../ui";

interface AuthFormProps {
    children: React.ReactNode;
}

const AuthForm: React.FC<AuthFormProps> = (props) => {
    const style =
        "w-[90%] max-w-md mx-auto mt-28 text-center p-6 shadow-lg rounded-xl bg-white";

    return <Card className={style}>{props.children}</Card>;
};

export default AuthForm;
