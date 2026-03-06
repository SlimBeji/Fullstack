package orm

type Table string

const (
	TableUsers  Table = "users"
	TablePlaces Table = "places"
)

type Model string

const (
	ModelUser  Model = "User"
	ModelPlace Model = "Place"
)
