package types_

import (
	"encoding/json"
	"strconv"
)

type FlexFloat float64

func (f *FlexFloat) UnmarshalJSON(data []byte) error {
	// Try direct number
	var num float64
	mainErr := json.Unmarshal(data, &num)
	if mainErr == nil {
		*f = FlexFloat(num)
		return nil
	}

	// Try string
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return mainErr
	}

	v, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return mainErr
	}

	*f = FlexFloat(v)
	return nil
}

type FlexInt int

func (i *FlexInt) UnmarshalJSON(data []byte) error {
	// Try direct number
	var num int
	mainErr := json.Unmarshal(data, &num)
	if mainErr == nil {
		*i = FlexInt(num)
		return nil
	}

	// Try string
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return mainErr
	}

	v, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return mainErr
	}

	*i = FlexInt(int(v))
	return nil
}

type FlexBool bool

func (b *FlexBool) UnmarshalJSON(data []byte) error {
	// Try direct boolean
	var val bool
	mainErr := json.Unmarshal(data, &val)
	if mainErr == nil {
		*b = FlexBool(val)
		return nil
	}

	// Try string: "true", "false", "1", "0"
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return mainErr
	}

	switch s {
	case "true", "1":
		*b = FlexBool(true)
	case "false", "0":
		*b = FlexBool(false)
	default:
		// fallback to strconv.ParseBool
		v, err := strconv.ParseBool(s)
		if err != nil {
			return mainErr
		}
		*b = FlexBool(v)
	}

	return nil
}
