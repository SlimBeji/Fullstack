import { useEffect } from "react";

import { HttpError, LoadingSpinner } from "../components/ui";
import UsersList from "../components/user/UsersList";
import { useHttp } from "../hooks";
import { User } from "../types";

const Users: React.FC = () => {
    const [data, sendRequest, clearError] = useHttp();

    useEffect(() => {
        sendRequest("/users", "get", undefined, false);
    }, [sendRequest]);

    return (
        <>
            {data.error?.message && (
                <HttpError
                    header="Could not fetch users!"
                    error={data.error}
                    onClear={() => clearError()}
                />
            )}
            {data.loading && (
                <div className="center">
                    <LoadingSpinner asOverlay />
                </div>
            )}
            {data.json?.data && <UsersList items={data.json.data as User[]} />}
        </>
    );
};

export default Users;
