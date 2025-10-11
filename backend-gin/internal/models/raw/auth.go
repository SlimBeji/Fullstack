//go:generate go run ../../../cmd/schemas_parser/main.go -in ./auth.go -meta ../fields/auth.yaml -out ../schemas/auth.go

package raw

// schemas:tag
type TokenPayload struct {
	UserId any `tag:"userId"`
	Email  any `tag:"email"`
}

// schemas:tag
type SignupForm struct {
	Name     any `tag:"name"`
	Email    any `tag:"email"`
	Password any `tag:"password"`
	Image    any `tag:"image,optional"`
}

// schemas:tag
type SigninForm struct {
	Username any `tag:"email,json=username"`
	Password any `tag:"password"`
}

// schemas:tag
type EncodedToken struct {
	AccessToken any `tag:"access_token"`
	TokenType   any `tag:"token_type"`
	UserId      any `tag:"userId"`
	Email       any `tag:"email"`
	ExpiresIn   any `tag:"expires_in"`
}
