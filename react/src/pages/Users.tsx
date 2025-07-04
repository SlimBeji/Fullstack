import { useEffect } from "react";

import UsersList from "../components/user/UsersList";
import { ErrorModal, LoadingSpinner } from "../components/ui";
import { useHttp } from "../hooks";
import { User } from "../types";

const Users: React.FC = () => {
    const [data, sendRequest, clearError] = useHttp();

    useEffect(() => {
        sendRequest("/users", "get");
    }, []);

    return (
        <>
            {data.error?.message && (
                <ErrorModal
                    header="Could not fetch users!"
                    error={data.error.message}
                    onClear={() => clearError()}
                />
            )}
            {data.loading && (
                <div className="center">
                    <LoadingSpinner asOverlay />
                </div>
            )}
            {data.data?.parsed?.data && (
                <UsersList items={data.data.parsed.data as User[]} />
            )}
        </>
    );
};

export default Users;
