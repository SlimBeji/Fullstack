import { createContext } from "react";
import { EncodedUserToken } from "../../types";

interface AuthContextType {
    authData: EncodedUserToken | null;
    login: (data: EncodedUserToken) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
    authData: null,
    login: (_: EncodedUserToken) => {},
    logout: () => {},
});
