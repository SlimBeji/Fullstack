package schemas

type User struct {
	Name     string   `json:"name"`
	Email    string   `json:"email"`
	IsAdmin  bool     `json:"isAdmin"`
	Id       string   `json:"id"`
	ImageUrl string   `json:"imageUrl"`
	Places   []string `json:"places"`
}
