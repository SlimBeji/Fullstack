import { useParams } from "react-router-dom";

import PlaceList from "../components/PlaceList";

import { Place } from "../../shared/types";
import { DUMMY_PLACES } from "./data";

const UserPlaces: React.FC = () => {
    const { userId } = useParams();
    const places = DUMMY_PLACES.filter(
        (p: Place) => String(p.creatorId) === userId
    );
    return <PlaceList items={places} />;
};

export default UserPlaces;
