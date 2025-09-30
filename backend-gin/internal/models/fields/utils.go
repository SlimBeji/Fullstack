package fields

import (
	"encoding/json"
	"mime/multipart"
)

type Field[T string | []string | bool | int | float64 | []float64 | *multipart.FileHeader] struct {
	Value T
}

var SupportedFields []any = []any{
	Field[string]{},
	Field[[]string]{},
	Field[bool]{},
	Field[int]{},
	Field[float64]{},
	Field[[]float64]{},
	Field[*multipart.FileHeader]{},
}

func (v *Field[T]) UnmarshalJSON(data []byte) error {
	return json.Unmarshal(data, &v.Value)
}

func (v Field[T]) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.Value)
}
