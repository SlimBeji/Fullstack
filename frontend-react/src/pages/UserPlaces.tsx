import { HttpStatusCode } from "axios";
import { useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";

import { PlaceList } from "../components/places";
import { HttpError, LoadingSpinner } from "../components/ui";
import { useHttp } from "../hooks";
import { useAppSelector } from "../states";
import { Place } from "../types";

const UserPlaces: React.FC = () => {
    const authData = useAppSelector((state) => state.auth.data);
    const [data, sendRequest, clearError] = useHttp({ ignoreNotFound: true });
    const { userId } = useParams();

    const isSameUser = userId === authData?.userId ? true : false;

    const fetchPlaces = useCallback(
        async (userId: string | undefined) => {
            if (!userId) {
                return;
            }

            try {
                await sendRequest(
                    `/places?creatorId=${userId}`,
                    "get",
                    undefined,
                    false
                );
            } catch (err) {
                console.log(err);
            }
        },
        [sendRequest]
    );

    useEffect(() => {
        fetchPlaces(userId);
    }, [fetchPlaces, userId]);

    const onDelete = () => {
        fetchPlaces(userId);
    };

    const renderPlaces = (): React.JSX.Element | undefined => {
        if (!data.loading && data.json?.data) {
            let places = data.json.data as Place[];
            if (data.statusCode === HttpStatusCode.NotFound) {
                places = [];
            }
            return (
                <PlaceList
                    sameAuthenticatedUser={isSameUser}
                    items={places}
                    onDelete={onDelete}
                />
            );
        }
    };

    return (
        <>
            {data.error && (
                <HttpError error={data.error} onClear={clearError} />
            )}
            {data.loading && (
                <div className="center">
                    <LoadingSpinner asOverlay />
                </div>
            )}
            {renderPlaces()}
        </>
    );
};

export default UserPlaces;
