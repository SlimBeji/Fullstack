package utils

import (
	"encoding/json"
	"fmt"

	"github.com/go-viper/mapstructure/v2"
)

func SmartDecode(in map[string]any, out any) error {
	// using WeaklyTypedInput for easy int conversion like "1"->1
	decoderConfig := &mapstructure.DecoderConfig{
		Result:           out,
		TagName:          "json",
		WeaklyTypedInput: true,
	}

	decoder, err := mapstructure.NewDecoder(decoderConfig)
	if err != nil {
		return fmt.Errorf("failed to create decoder: %w", err)
	}
	return decoder.Decode(in)
}

func DecodeJSONBFields(data map[string]any, fields ...string) error {
	for _, field := range fields {
		if bytes, ok := data[field].([]byte); ok {
			var decoded any
			if err := json.Unmarshal(bytes, &decoded); err != nil {
				return err
			}
			data[field] = decoded
		}
	}
	return nil
}
