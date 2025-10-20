package types_

import "fmt"

type ApiError struct {
	Code    int
	Message string
	Err     error
}

func (ae ApiError) Error() string {
	if ae.Err != nil {
		return fmt.Sprintf("API %d Error: %s - %v", ae.Code, ae.Message, ae.Err)
	}
	return fmt.Sprintf("API %d Error: %s", ae.Code, ae.Message)
}

func (ae ApiError) Unwrap() error {
	return ae.Err
}
