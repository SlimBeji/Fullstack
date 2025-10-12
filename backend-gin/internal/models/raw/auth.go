//go:generate go run ../../../cmd/schemas_parser/main.go -in ./auth.go -meta ../fields/auth.yaml -out ../schemas/auth.go

package raw

// schemas:tag
type TokenPayload struct {
	UserId any `tag:"userId"`
	Email  any `tag:"email"`
}

// schemas:tag
type SignupForm struct {
	Name     any `tag:"name" form:"name"`
	Email    any `tag:"email" form:"email"`
	Password any `tag:"password" form:"password"`
	Image    any `tag:"image,optional" form:"image"`
}

// schemas:tag
type SigninForm struct {
	Username any `tag:"username" form:"username" default:"mslimbeji@gmail.com"`
	Password any `tag:"password" form:"password" default:"very_secret"`
}

// schemas:tag
type EncodedToken struct {
	AccessToken any `tag:"access_token"`
	TokenType   any `tag:"token_type"`
	UserId      any `tag:"userId"`
	Email       any `tag:"email"`
	ExpiresIn   any `tag:"expires_in"`
}
