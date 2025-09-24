import { useEffect } from "react";

import { HttpError, LoadingSpinner } from "@/components/ui";
import { UsersList } from "@/components/user";
import { useHttp } from "@/lib";
import type { User } from "@/types";

const Users: React.FC = () => {
    const [data, sendRequest, clearError] = useHttp();

    useEffect(() => {
        sendRequest("/users/", "get");
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
            {data.loading && <LoadingSpinner asOverlay />}
            {data.json?.data && <UsersList items={data.json.data as User[]} />}
        </>
    );
};

export default Users;
