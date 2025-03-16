import { createContext } from "react";

interface AuthContextType {
    isLoggedIn: boolean;
    login: () => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    login: () => {},
    logout: () => {},
});
