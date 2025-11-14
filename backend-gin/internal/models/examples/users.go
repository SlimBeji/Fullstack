package examples

import (
	"backend/internal/lib/utils"
	"backend/internal/models/schemas"
)

var Users = []schemas.UserSeed{
	{
		Ref:      1,
		Name:     "Slim Beji",
		Email:    "mslimbeji@gmail.com",
		Password: "very_secret",
		ImageUrl: utils.GetImagePath("avatar1.jpg"),
		IsAdmin:  true,
	},
	{
		Ref:      2,
		Name:     "Mohamed Slim Beji",
		Email:    "beji.slim@yahoo.fr",
		Password: "very_secret",
		ImageUrl: utils.GetImagePath("avatar2.jpg"),
		IsAdmin:  false,
	},
}
