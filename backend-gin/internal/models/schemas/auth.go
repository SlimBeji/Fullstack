package schemas

type AccessToken struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	UserId      string `json:"userId"`
	Email       string `json:"email"`
	ExpiresIn   int16  `json:"expires_in"`
}
