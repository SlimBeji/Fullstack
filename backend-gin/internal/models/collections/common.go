package collections

import (
	"backend/internal/types_"
)

var IndexStore types_.IndexMapping = types_.IndexMapping{
	types_.CollectionUsers:  UserIndexes,
	types_.CollectionPlaces: PlaceIndexes,
}
