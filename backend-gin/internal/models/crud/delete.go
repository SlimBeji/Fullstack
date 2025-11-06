package crud

import (
	"backend/internal/models/schemas"
	"backend/internal/types_"
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type DocumentDeleter[Read any] interface {
	DocumentReader[Read]
	FindOneAndDelete(context.Context, any, ...*options.FindOneAndDeleteOptions) *mongo.SingleResult
	PostDelete(mongo.SessionContext, bson.Raw) error
	AuthDelete(*schemas.UserRead, *Read) error
}

func DeleteDocument[Read any](
	dd DocumentDeleter[Read], filter bson.M, ctx context.Context,
) error {
	client := dd.Database().Client()
	session, err := client.StartSession()
	if err != nil {
		return err
	}
	defer session.EndSession(ctx)

	return mongo.WithSession(
		ctx,
		session,
		func(sc mongo.SessionContext) error {
			if err := session.StartTransaction(); err != nil {
				return err
			}

			deleteResult := dd.FindOneAndDelete(ctx, filter)
			raw, err := deleteResult.Raw()
			if err != nil {
				session.AbortTransaction(sc)
				return err
			}

			if err := dd.PostDelete(sc, raw); err != nil {
				session.AbortTransaction(sc)
				return err
			}

			if err := session.CommitTransaction(sc); err != nil {
				return err
			}
			return nil
		},
	)
}

func Delete[Read any](
	dd DocumentDeleter[Read], id string, ctx context.Context,
) error {
	objectId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return types_.UnprocessableErr(
			fmt.Sprintf("invalid object ID %s", id), err,
		)
	}
	return DeleteDocument(dd, bson.M{"_id": objectId}, ctx)
}

func UserDelete[Read any](
	dd DocumentDeleter[Read],
	user *schemas.UserRead,
	id string,
	ctx context.Context,
) error {
	doc, err := UserGetById(dd, user, id, ctx)
	if err != nil {
		return err
	}

	if user == nil {
		return types_.NotAuthenticatedErr()
	}

	if err := dd.AuthDelete(user, &doc); err != nil {
		return err
	}

	return Delete(dd, id, ctx)
}
