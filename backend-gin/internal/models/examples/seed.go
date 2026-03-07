package examples

import (
	"backend/internal/models/cruds"
	"backend/internal/models/orm"
	"backend/internal/models/schemas"
	"backend/internal/services/instances"
	"context"
	"errors"
	"fmt"
	"sync"

	"golang.org/x/sync/errgroup"
)

type RefMappings map[orm.Model]map[int]uint

func seedUsers(ctx context.Context, refs RefMappings, isVerbose bool) error {
	userRefs := make(map[int]uint)
	refs[orm.ModelUser] = userRefs
	cu := cruds.GetCRUDSUser()
	storage := instances.GetStorage()

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
			userIn := schemas.UserCreate{
				Name:     userEx.Name,
				Email:    userEx.Email,
				IsAdmin:  userEx.IsAdmin,
				Password: userEx.Password,
				ImageURL: userEx.ImageURL,
			}

			url, err := storage.UploadFile(ctx, userIn.ImageURL, "")
			if err != nil {
				return handleError(err, isVerbose)
			}
			userIn.ImageURL = url

			insertedId, err := cu.Create(ctx, userIn)
			if err != nil {
				return handleError(err, isVerbose)
			}

			mu.Lock()
			userRefs[example.Ref] = insertedId
			mu.Unlock()
			return nil
		})
	}

	return eg.Wait()
}

func seedPlaces(ctx context.Context, refs RefMappings, isVerbose bool) error {
	placeRefs := make(map[int]uint)
	refs[orm.ModelPlace] = placeRefs
	cp := cruds.GetCRUDSPlace()
	storage := instances.GetStorage()

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
			placeIn := schemas.PlaceCreate{
				Title:       placeEx.Title,
				Description: placeEx.Description,
				Address:     placeEx.Address,
				Location:    placeEx.Location,
				ImageURL:    placeEx.ImageURL,
			}

			url, err := storage.UploadFile(ctx, placeIn.ImageURL, "")
			if err != nil {
				return handleError(err, isVerbose)
			}
			placeIn.ImageURL = url

			creatorId, found := refs[orm.ModelUser][placeEx.CreatorRef]
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

			insertedId, err := cp.Seed(ctx, placeIn, placeEx.Embedding)
			if err != nil {
				return handleError(err, isVerbose)
			}

			mu.Lock()
			placeRefs[example.Ref] = insertedId
			mu.Unlock()
			return nil
		})
	}

	return eg.Wait()
}

func SeedDb(verbose ...bool) error {
	ctx := context.Background()
	refs := make(RefMappings)

	isVerbose := false
	if len(verbose) > 0 {
		isVerbose = verbose[0]
	}

	if err := seedUsers(ctx, refs, isVerbose); err != nil {
		if isVerbose {
			fmt.Println(err.Error())
		}
		return err
	} else if isVerbose {
		fmt.Println("✅ Collection User seeded!")
	}

	if err := seedPlaces(ctx, refs, isVerbose); err != nil {
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

	ctx := context.Background()
	pgClient := instances.GetPgClient()

	for _, table := range orm.AllTables {
		err := pgClient.ResetTable(ctx, string(table))
		if err != nil {
			message := fmt.Sprintf("could not reset table %s", table)
			if isVerbose {
				fmt.Println(message)
			}
		} else if isVerbose {
			fmt.Printf("✅ Table %s cleared!\n", table)
		}
	}

	rc := instances.GetRedisClient()
	rc.FlushAll(ctx)

	if isVerbose {
		fmt.Println("✅ Cache DB flushed")
		fmt.Println("✅ Finished. You may exit")
	}

	return nil
}
