package examples

import (
	"backend/internal/lib/clients"
	"backend/internal/types_"
	"errors"
	"fmt"
)

func createCollections(mc *clients.MongoClient, isVerbose bool) error {
	for _, collection := range types_.AllCollections {
		name := string(collection)
		err := mc.CreateCollection(name)
		if err != nil {
			if isVerbose {
				fmt.Printf(
					"could not create collection %s: %s", name, err.Error(),
				)
			}
			return fmt.Errorf(
				"could not create collection %s: %w", name, err,
			)
		}
	}
	return nil
}

func seedUsers(mc *clients.MongoClient, isVerbose bool) error {
	return nil
}

func seedPlaces(mc *clients.MongoClient, isVerbose bool) error {
	return nil
}

func SeedDb(verbose ...bool) error {
	mc := clients.GetMongo()

	isVerbose := false
	if len(verbose) > 0 {
		isVerbose = verbose[0]
	}

	if err := createCollections(mc, isVerbose); err != nil {
		if isVerbose {
			fmt.Println(err.Error())
		}
		return err
	}

	if err := seedUsers(mc, isVerbose); err != nil {
		if isVerbose {
			fmt.Println(err.Error())
		}
		return err
	} else if isVerbose {
		fmt.Println("✅ Collection User seeded!")
	}

	if err := seedPlaces(mc, isVerbose); err != nil {
		if isVerbose {
			fmt.Println(err.Error())
		}
		return err
	} else if isVerbose {
		fmt.Println("✅ Collection Place seeded!")
	}

	if isVerbose {
		fmt.Println("✅ Finished. You may exit")
	}

	return nil
}

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
