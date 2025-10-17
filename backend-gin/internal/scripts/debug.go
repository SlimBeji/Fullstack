package scripts

import (
	"backend/internal/lib/clients"
	"fmt"
)

func Debug() {
	mongo := clients.GetMongo()
	defer mongo.Close()
	collections, err := mongo.ListCollections()
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(collections)
	}
}
