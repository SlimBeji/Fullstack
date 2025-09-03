import { Place } from "../../types";
import PlaceItem from "./PlaceItem";

interface PlaceListProps {
    items: Place[];
    onDelete: () => void;
}

const PlaceList: React.FC<PlaceListProps> = ({ items, onDelete }) => {
    return (
        <ul className="places-list">
            {items.map((p: Place) => {
                return <PlaceItem key={p.id} place={p} onDelete={onDelete} />;
            })}
        </ul>
    );
};

export default PlaceList;
