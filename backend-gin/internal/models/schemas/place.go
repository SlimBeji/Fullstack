package schemas

type Location struct {
	Lat float32 `json:"lat"`
	Lng float32 `json:"lng"`
}

type Place struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Address     string   `json:"address"`
	Location    Location `json:"location"`
	Id          string   `json:"id"`
	ImageUrl    string   `json:"imageUrl"`
	CreatorId   string   `json:"creatorId"`
}
