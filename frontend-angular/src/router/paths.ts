export enum Route {
    AUTH = 'auth',
    HOME = '',
    USER_PLACES = ':userId/places',
    NEW_PLACE = 'places/new',
    UPDATE_PLACE = 'places/:placeId',
    ANY = '**',
}
