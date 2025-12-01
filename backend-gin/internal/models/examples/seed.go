package examples

import (
	"backend/internal/lib/clients"
	"backend/internal/models/collections"
	"backend/internal/models/crud"
	"backend/internal/models/schemas"
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/jinzhu/copier"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/sync/errgroup"
)

func createCollections(mc *clients.MongoClient, isVerbose bool) error {
	var eg errgroup.Group

	for _, collection := range collections.AllCollections {
		name := string(collection)
		eg.Go(func() error {
			if err := mc.CreateCollection(name); err != nil {
				if isVerbose {
					fmt.Printf(
						"could not create collection %s: %s", name, err.Error(),
					)
				}
				return fmt.Errorf(
					"could not create collection %s: %w", name, err,
				)
			}
			return nil
		})
	}
	return eg.Wait()
}

func seedUsers(refs RefMappings, isVerbose bool) error {
	userRefs := make(map[int]primitive.ObjectID)
	refs[collections.Users] = userRefs
	uc := collections.GetUserCollection()
	storage := clients.GetStorage()
	ctx := context.Background()

	handleError := func(err error, isVerbose bool) error {
		if isVerbose {
			fmt.Println(err.Error())
		}
		return fmt.Errorf(
			"could not create user document: %w", err,
		)
	}

	var eg errgroup.Group
	var mu sync.Mutex
	for _, userEx := range Users {
		example := userEx // capture loop variable
		eg.Go(func() error {
			var userIn schemas.UserCreate
			if err := copier.Copy(&userIn, &example); err != nil {
				return handleError(err, isVerbose)
			}

			url, err := storage.UploadFile(userIn.ImageUrl)
			if err != nil {
				return handleError(err, isVerbose)
			}
			userIn.ImageUrl = url

			raw, err := crud.InsertExample(uc, &userIn, ctx)
			if err != nil {
				return handleError(err, isVerbose)
			}

			mu.Lock()
			userRefs[example.Ref] = raw.InsertedID.(primitive.ObjectID)
			mu.Unlock()
			return nil
		})
	}

	return eg.Wait()
}

func seedPlaces(refs RefMappings, isVerbose bool) error {
	placeRefs := make(map[int]primitive.ObjectID)
	refs[collections.Places] = placeRefs
	uc := collections.GetUserCollection()
	pc := collections.GetPlaceCollection()
	storage := clients.GetStorage()
	ctx := context.Background()

	handleError := func(err error, isVerbose bool) error {
		if isVerbose {
			fmt.Println(err.Error())
		}
		return fmt.Errorf(
			"could not create place document: %w", err,
		)
	}

	var eg errgroup.Group
	var mu sync.Mutex
	for _, placeEx := range Places {
		example := placeEx // capture loop variable
		eg.Go(func() error {
			var placeIn schemas.PlaceCreate
			if err := copier.Copy(&placeIn, &example); err != nil {
				return handleError(err, isVerbose)
			}

			url, err := storage.UploadFile(placeIn.ImageUrl)
			if err != nil {
				return handleError(err, isVerbose)
			}
			placeIn.ImageUrl = url

			creatorId, found := refs[collections.Users][placeEx.CreatorRef]
			if !found {
				message := fmt.Sprintf(
					"examples corrrupted, could not find user with ref %d while creating place with ref %d",
					placeEx.CreatorRef,
					placeEx.Ref,
				)
				if isVerbose {
					fmt.Println(message)
				}
				return errors.New(message)
			}
			placeIn.CreatorID = creatorId

			raw, err := crud.InsertExample(pc, &placeIn, ctx)
			if err != nil {
				return handleError(err, isVerbose)
			}

			insertedId := raw.InsertedID.(primitive.ObjectID)
			update := bson.M{"$addToSet": bson.M{"places": insertedId}}
			userFilter := bson.M{"_id": creatorId}
			_, err = uc.FindOneAndUpdate(ctx, userFilter, update).Raw()
			if err != nil {
				handleError(err, isVerbose)
			}

			mu.Lock()
			placeRefs[example.Ref] = insertedId
			mu.Unlock()
			return nil
		})
	}

	return eg.Wait()
}

type RefMappings map[collections.CollectionName]map[int]primitive.ObjectID

func SeedDb(verbose ...bool) error {
	mc := clients.GetMongo()
	refs := make(RefMappings)

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

	if err := seedUsers(refs, isVerbose); err != nil {
		if isVerbose {
			fmt.Println(err.Error())
		}
		return err
	} else if isVerbose {
		fmt.Println("✅ Collection User seeded!")
	}

	if err := seedPlaces(refs, isVerbose); err != nil {
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
