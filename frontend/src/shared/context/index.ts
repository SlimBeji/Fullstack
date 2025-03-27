import { createContext } from "react";

interface AuthContextType {
    isLoggedIn: boolean;
    userId?: string;
    login: (uid: string) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    userId: "",
    login: (_: string) => {},
    logout: () => {},
});
