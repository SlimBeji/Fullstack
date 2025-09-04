import { Place } from "../../types";
import { Button } from "../form";
import PlaceItem from "./PlaceItem";

interface PlaceListProps {
    sameAuthenticatedUser: boolean;
    items: Place[];
    onDelete: () => void;
}

const PlaceList: React.FC<PlaceListProps> = ({
    items,
    onDelete,
    sameAuthenticatedUser,
}) => {
    if (items.length > 0) {
        return (
            <ul className="places-list">
                {items.map((p: Place) => {
                    return (
                        <PlaceItem key={p.id} place={p} onDelete={onDelete} />
                    );
                })}
            </ul>
        );
    }

    if (sameAuthenticatedUser) {
        return (
            <div className="no-places">
                <div className="card">
                    <h2>No places found. Maybe create one?</h2>
                    <Button to="/places/new">Share</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="no-places">
            <div className="card">
                <h2>This user has not created places yet</h2>
            </div>
        </div>
    );
};

export default PlaceList;
