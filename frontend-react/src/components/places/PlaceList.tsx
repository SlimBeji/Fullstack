import { Place } from "../../types";
import PlaceItem from "./PlaceItem";

interface PlaceListProps {
    items: Place[];
    onDelete: () => void;
}

const PlaceList: React.FC<PlaceListProps> = ({ items, onDelete }) => {
    return (
        <ul className="list-none m-4 mx-auto p-0 w-[90%] max-w-[40rem]">
            {items.map((p: Place) => {
                return <PlaceItem key={p.id} place={p} onDelete={onDelete} />;
            })}
        </ul>
    );
};

export default PlaceList;
