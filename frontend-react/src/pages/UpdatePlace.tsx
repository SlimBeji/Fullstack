import { useParams } from "react-router-dom";

import { PlaceUpdateForm } from "../components/places";

const UpdatePlace: React.FC = () => {
    const placeId = useParams().placeId!;

    return <PlaceUpdateForm placeId={placeId} />;
};

export default UpdatePlace;
