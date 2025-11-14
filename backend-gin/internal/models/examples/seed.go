package examples

import (
	"backend/internal/lib/clients"
	"errors"
	"fmt"
)

func DumpDb(verbose ...bool) error {
	isVerbose := false
	if len(verbose) > 0 {
		isVerbose = verbose[0]
	}

	mc := clients.GetMongo()
	collections, err := mc.ListCollections()
	if err != nil {
		message := "could not extract list of collecions"
		if isVerbose {
			fmt.Println(message)
		}
		return errors.New(message)
	}

	for _, name := range collections {
		err := mc.DropCollection(name)
		if err != nil {
			message := fmt.Sprintf("could not delete collection %s", name)
			if isVerbose {
				fmt.Println(message)
			}
			return errors.New(message)
		} else if isVerbose {
			fmt.Printf("✅ Collection %s cleared!\n", name)
		}
	}

	rc := clients.GetRedisClient()
	rc.FlushAll()

	if isVerbose {
		fmt.Println("✅ Cache DB flushed")
		fmt.Println("✅ Finished. You may exit")
	}

	return nil
}
