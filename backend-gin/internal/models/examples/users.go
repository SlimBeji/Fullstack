package examples

import (
	"backend/internal/models/schemas"
	"backend/internal/static"
)

var Users = []schemas.UserSeed{
	{
		Ref:      1,
		Name:     "Slim Beji",
		Email:    "mslimbeji@gmail.com",
		Password: "very_secret",
		ImageUrl: static.GetImagePath("avatar1.jpg"),
		IsAdmin:  true,
	},
	{
		Ref:      2,
		Name:     "Mohamed Slim Beji",
		Email:    "beji.slim@yahoo.fr",
		Password: "very_secret",
		ImageUrl: static.GetImagePath("avatar2.jpg"),
		IsAdmin:  false,
	},
}
