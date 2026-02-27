package utils

import (
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
