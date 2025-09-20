import { useState } from "react";

import placeholder from "../../assets/place_placeholder.jpg";
import { Button } from "../../components/form";
import { HttpError, LoadingSpinner, Map, Modal } from "../../components/ui";
import { useHttp } from "../../lib";
import { useAppSelector } from "../../store";
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
        closeDeleteModal();
        sendRequest(`/places/${place.id}`, "delete").then(() => {
            onDelete();
        });
    };

    const deleteModalFooter = (
        <>
            <Button color="danger" onClick={onDelteHandler}>
                DELETE
            </Button>
            <Button onClick={closeDeleteModal}>CANCEL</Button>
        </>
    );
    return (
        <>
            {data.error?.message && (
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
                footer={
                    <Button inverse onClick={closeMapHanlder}>
                        CLOSE
                    </Button>
                }
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
                <p className="delete-text-messaage">
                    Do you want to proceed and delete this place?
                </p>
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
                        <Button
                            color="secondary"
                            inverse
                            onClick={openMapHanlder}
                        >
                            VIEW ON MAP
                        </Button>
                        {authData?.userId === place.creatorId && (
                            <Button to={`/places/${place.id}`}>EDIT</Button>
                        )}
                        {authData?.userId === place.creatorId && (
                            <Button color="danger" onClick={openDeleteModal}>
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
