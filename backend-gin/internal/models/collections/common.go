package collections

import (
	"go.mongodb.org/mongo-driver/mongo"
)

type CollectionName string

const (
	Users  CollectionName = "users"
	Places CollectionName = "places"
)

var AllCollections = []CollectionName{Users, Places}

type IndexMapping map[CollectionName][]mongo.IndexModel

var IndexStore = IndexMapping{
	Users:  UserIndexes,
	Places: PlaceIndexes,
}
