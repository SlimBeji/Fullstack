export enum AppRoute {
    AUTH = '/auth',
    HOME = '/',
    USER_PLACES = '/:userId/places',
    NEW_PLACE = '/places/new',
    UPDATE_PLACE = '/places/:placeId',
    ANY = '*',
}

export const userPlacesRoute = (userId: number | string): string => {
    return AppRoute.USER_PLACES.replace(':userId', `${userId}`);
};

export const updatePlaceRoute = (placeId: number | string): string => {
    return AppRoute.UPDATE_PLACE.replace(':placeId', `${placeId}`);
};
