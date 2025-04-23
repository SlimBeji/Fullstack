import { useState, useContext } from "react";

import "./PlaceItem.css";

import { AuthContext } from "../../shared/context";
import { Place } from "../../shared/types";
import {
    Card,
    Map,
    Modal,
    ErrorModal,
    LoadingSpinner,
} from "../../shared/components/ui";
import { Button } from "../../shared/components/form";
import { useHttp } from "../../shared/hooks";
import placeholder from "../../static/place_placeholder.jpg";

interface PlaceItemProps {
    place: Place;
    onDelete: () => void;
}

const PlaceItem: React.FC<PlaceItemProps> = ({ place, onDelete }) => {
    const auth = useContext(AuthContext);
    const [data, sendRequest, clearError] = useHttp();
    const [showMap, setShowMap] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const openMapHanlder = (): void => {
        setShowMap(true);
    };

    const closeMapHanlder = (): void => {
        setShowMap(false);
    };

    const openDeleteModal = (): void => {
        setShowDeleteModal(true);
    };

    const closeDeleteModal = (): void => {
        setShowDeleteModal(false);
    };

    const onDelteHandler = (): void => {
        setShowDeleteModal(false);
        sendRequest(`/places/${place.id}`, "delete").then(() => {
            onDelete();
        });
    };

    const mapModalFooter = <Button onClick={closeMapHanlder}>CLOSE</Button>;

    const deleteModalFooter = (
        <>
            <Button inverse onClick={closeDeleteModal}>
                CANCEL
            </Button>
            <Button danger onClick={onDelteHandler}>
                DELETE
            </Button>
        </>
    );

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
            <Modal
                show={showMap}
                onCancel={closeMapHanlder}
                header={place.address}
                contentClass="place-item__modal-content"
                footerClass="place-item__modal-action"
                footer={mapModalFooter}
            >
                <Map
                    position={place.location}
                    zoom={13}
                    markerText={place.title}
                />
            </Modal>
            <Modal
                show={showDeleteModal}
                onCancel={closeDeleteModal}
                header="Are you sure?"
                footerClass="place-item__modal-actions"
                footer={deleteModalFooter}
            >
                <p>Do you want to proceed and delete this place?</p>
            </Modal>
            <li className="place-item">
                <Card className="place-item__content">
                    <div className="place-item__image">
                        <img
                            src={place.imageUrl || placeholder}
                            alt={place.title}
                        />
                    </div>
                    <div className="place-item__info">
                        <h2>{place.title}</h2>
                        <h2>{place.address}</h2>
                        <p>{place.description}</p>
                    </div>
                    <div className="place-item__actions">
                        <Button onClick={openMapHanlder} inverse>
                            VIEW ON MAP
                        </Button>
                        {auth.isLoggedIn && (
                            <Button to={`/places/${place.id}`}>EDIT</Button>
                        )}
                        {auth.isLoggedIn && (
                            <Button danger onClick={openDeleteModal}>
                                DELETE
                            </Button>
                        )}
                    </div>
                </Card>
            </li>
        </>
    );
};

export default PlaceItem;
