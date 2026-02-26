/*
Go json package does not handle coercion of basic types when unmarshalling,
(e.g. "1" is not accepted as int, "false" is not accepted as boolean)
This file include helper types that works with the json package accepts
and acccepts strings during unmarshalling
*/

package types_

import (
	"backend/internal/lib/utils"
	"encoding/json"
	"strconv"
)

type FlexFloat float64

func (f FlexFloat) MarshalJSON() ([]byte, error) {
	return json.Marshal(float64(f))
}

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

func (i FlexInt) MarshalJSON() ([]byte, error) {
	return json.Marshal(int(i))
}

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

	v, err := strconv.Atoi(s)
	if err != nil {
		return mainErr
	}

	*i = FlexInt(int(v))
	return nil
}

type FlexBool bool

func (b FlexBool) MarshalJSON() ([]byte, error) {
	return json.Marshal(bool(b))
}

func (b *FlexBool) UnmarshalJSON(data []byte) error {
	// Try direct boolean
	var val bool
	mainErr := json.Unmarshal(data, &val)
	if mainErr == nil {
		*b = FlexBool(val)
		return nil
	}

	// Try string
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return mainErr
	}
	v, err := utils.CheckBool(s)
	if err != nil {
		return mainErr
	}

	*b = FlexBool(v)
	return nil
}
