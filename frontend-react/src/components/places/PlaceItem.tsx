import clsx from "clsx";
import { useState } from "react";

import { Button } from "@/components/form";
import { HttpError, LoadingSpinner, Map, Modal } from "@/components/ui";
import { useBackend } from "@/hooks";
import { updatePlaceRoute } from "@/router";
import { useAppSelector } from "@/store";
import type { Place } from "@/types";

import styles from "./PlaceItem.module.css";

const placeholder = "/public/place_placeholder.jpg";

interface PlaceItemProps {
    place: Place;
    onDelete: () => void;
}

const PlaceItem: React.FC<PlaceItemProps> = ({ place, onDelete }) => {
    const authData = useAppSelector((state) => state.auth.data);
    const [data, sendRequest, clearError] = useBackend();
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
            {data.loading && <LoadingSpinner asOverlay />}
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
                <p className={styles["delete-text-messaage"]}>
                    Do you want to proceed and delete this place?
                </p>
            </Modal>

            <li className={styles["place-item"]}>
                <div className={clsx(["card", styles["place-item-card"]])}>
                    <div className={styles["image-container"]}>
                        <img
                            src={place.image_url || placeholder}
                            alt={place.title}
                        />
                    </div>
                    <div className={styles["place-info"]}>
                        <h2>{place.title}</h2>
                        <h2>{place.address}</h2>
                        <p>{place.description}</p>
                    </div>
                    <div className={styles["place-actions"]}>
                        <Button
                            color="secondary"
                            inverse
                            onClick={openMapHanlder}
                        >
                            VIEW ON MAP
                        </Button>
                        {authData?.user_id === place.creator_id && (
                            <>
                                <Button to={updatePlaceRoute(place.id)}>
                                    EDIT
                                </Button>
                                <Button
                                    color="danger"
                                    onClick={openDeleteModal}
                                >
                                    DELETE
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </li>
        </>
    );
};

export default PlaceItem;
