import { useParams } from "react-router-dom";
import { useEffect, useCallback } from "react";

import PlaceList from "../components/PlaceList";

import { ErrorModal, LoadingSpinner } from "../../shared/components/ui";
import { Place } from "../../shared/types";
import { useHttp } from "../../shared/hooks";
import { HttpStatusCode } from "axios";

const UserPlaces: React.FC = () => {
    const [data, sendRequest, clearError] = useHttp({ ignoreNotFound: true });
    const { userId } = useParams();

    const fetchPlaces = useCallback(
        async (userId: string | undefined) => {
            if (!userId) {
                return;
            }

            try {
                await sendRequest(`/places?creatorId=${userId}`, "get");
            } catch (err) {}
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
        if (!data.loading && data.data?.parsed?.data) {
            let places = data.data.parsed.data as Place[];
            if (data.statusCode === HttpStatusCode.NotFound) {
                places = [];
            }
            return <PlaceList items={places} onDelete={onDelete} />;
        }
    };

    return (
        <>
            {data.error && (
                <ErrorModal error={data.error.message} onClear={clearError} />
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
