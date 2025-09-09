import { BrowserRouter } from "react-router-dom";

import { MainNavigation } from "./components/navigation";
import { Router } from "./router";

function App() {
    return (
        <BrowserRouter>
            <MainNavigation />
            <Router />
        </BrowserRouter>
    );
}

export default App;
