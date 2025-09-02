import { useState } from "react";

import { Button } from "../../components/form";
import {
    Card,
    HttpError,
    LoadingSpinner,
    Map,
    Modal,
} from "../../components/ui";
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

    const mapModalFooter = <Button onClick={closeMapHanlder}>CLOSE</Button>;

    const deleteModalFooter = (
        <>
            <Button className="btn-inverse" onClick={closeDeleteModal}>
                CANCEL
            </Button>
            <Button className="btn-danger" onClick={onDelteHandler}>
                DELETE
            </Button>
        </>
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
                contentClass="p-0"
                footerClass="flex justify-end"
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
                contentClass="p-4"
                footerClass="flex justify-end space-x-2"
                footer={deleteModalFooter}
            >
                <p>Do you want to proceed and delete this place?</p>
            </Modal>

            <li className="my-4">
                <Card className="p-0">
                    <div className="w-full h-52 md:h-80 mr-6">
                        <img
                            src={place.imageUrl || placeholder}
                            alt={place.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="p-4 text-center">
                        <h2 className="mb-2">{place.title}</h2>
                        <h2 className="mb-2">{place.address}</h2>
                        <p className="mb-2">{place.description}</p>
                    </div>
                    <div className="p-4 text-center border-t border-gray-300">
                        <Button
                            className="mx-1 btn-inverse"
                            onClick={openMapHanlder}
                        >
                            VIEW ON MAP
                        </Button>
                        {authData?.userId === place.creatorId && (
                            <Button className="mx-1" to={`/places/${place.id}`}>
                                EDIT
                            </Button>
                        )}
                        {authData?.userId === place.creatorId && (
                            <Button
                                className="mx-1 btn-danger"
                                onClick={openDeleteModal}
                            >
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
