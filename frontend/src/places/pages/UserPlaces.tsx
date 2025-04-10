import { useParams } from "react-router-dom";
import { useEffect } from "react";

import PlaceList from "../components/PlaceList";

import { ErrorModal, LoadingSpinner } from "../../shared/components/ui";
import { Place } from "../../shared/types";
import { useHttp } from "../../shared/hooks";
import { HttpStatusCode } from "axios";

const UserPlaces: React.FC = () => {
    const [data, sendRequest, clearError] = useHttp({ ignoreNotFound: true });
    const { userId } = useParams();
    useEffect(() => {
        const fetchPlaces = async () => {
            try {
                await sendRequest(`/users/${userId}/places`, "get");
            } catch (err) {}
        };
        fetchPlaces();
    }, [sendRequest, userId]);

    const renderPlaces = (): React.JSX.Element | undefined => {
        if (!data.loading && data.data?.parsed) {
            let places = data.data.parsed as Place[];
            if (data.statusCode === HttpStatusCode.NotFound) {
                places = [];
            }
            return <PlaceList items={places} />;
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
