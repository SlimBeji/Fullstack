import "./MainHeader.css";

import { ReactNode } from "react";

interface MainHeaderProps {
    children?: ReactNode;
}

const MainHeader: React.FC<MainHeaderProps> = ({ children }) => {
    return <header className="main-header">{children}</header>;
};

export default MainHeader;
