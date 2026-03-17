package orm

type Table string

const (
	TableUsers  Table = "users"
	TablePlaces Table = "places"
)

var AllTables = []string{string(TableUsers), string(TablePlaces)}

type Model string

const (
	ModelUser  Model = "User"
	ModelPlace Model = "Place"
)

type Relation string

const (
	RelationUser  Relation = "Users"
	RelationPlace Relation = "Places"
)
