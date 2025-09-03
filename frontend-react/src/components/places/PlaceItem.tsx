import { useState } from "react";

import { Button } from "../../components/form";
import { HttpError, LoadingSpinner, Map, Modal } from "../../components/ui";
import { useHttp } from "../../hooks";
import { useAppSelector } from "../../states";
import placeholder from "../../static/place_placeholder.jpg";
import { Place } from "../../types";

interface PlaceItemProps {
    place: Place;
    onDelete: () => void;
}

const PlaceItem: React.FC<PlaceItemProps> = ({ place, onDelete }) => {
    const authData = useAppSelector((state) => state.auth.data);
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

    const mapModalFooter = (
        <footer className="place-item-map-modal-footer">
            <Button onClick={closeMapHanlder}>CLOSE</Button>
        </footer>
    );

    const deleteModalFooter = (
        <footer className="place-item-delete-modal-footer">
            <Button className="danger" onClick={onDelteHandler}>
                DELETE
            </Button>
            <Button className="inverse" onClick={closeDeleteModal}>
                CANCEL
            </Button>
        </footer>
    );
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
            <Modal
                show={showMap}
                onCancel={closeMapHanlder}
                header={place.address}
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
                footer={deleteModalFooter}
            >
                <div className="place-item-delete-modal-content">
                    <p>Do you want to proceed and delete this place?</p>
                </div>
            </Modal>

            <li className="place-item">
                <div className="card place-item-card">
                    <div className="image-container">
                        <img
                            src={place.imageUrl || placeholder}
                            alt={place.title}
                        />
                    </div>
                    <div className="place-info">
                        <h2>{place.title}</h2>
                        <h2>{place.address}</h2>
                        <p>{place.description}</p>
                    </div>
                    <div className="place-actions">
                        <Button className="inverse" onClick={openMapHanlder}>
                            VIEW ON MAP
                        </Button>
                        {authData?.userId === place.creatorId && (
                            <Button to={`/places/${place.id}`}>EDIT</Button>
                        )}
                        {authData?.userId === place.creatorId && (
                            <Button
                                className="danger"
                                onClick={openDeleteModal}
                            >
                                DELETE
                            </Button>
                        )}
                    </div>
                </div>
            </li>
        </>
    );
};

export default PlaceItem;
