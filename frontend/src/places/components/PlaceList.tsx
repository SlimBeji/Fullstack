import "./PlaceList.css";

import { Place } from "../../shared/types";

import PlaceItem from "./PlaceItem";
import { Card } from "../../shared/components/ui";
import { Button } from "../../shared/components/form";

interface PlaceListProps {
    items: Place[];
}

const PlaceList: React.FC<PlaceListProps> = ({ items }) => {
    if (items.length === 0) {
        return (
            <div className="place-list center">
                <Card>
                    <h2>No places found. Maybe create one?</h2>
                    <Button to="/places/new">Share</Button>
                </Card>
            </div>
        );
    }
    return (
        <ul className="place-list">
            {items.map((p: Place) => {
                return <PlaceItem key={p.id} place={p} />;
            })}
        </ul>
    );
};

export default PlaceList;
