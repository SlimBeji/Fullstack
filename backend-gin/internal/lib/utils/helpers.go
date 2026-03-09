package utils

import (
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"
	"unicode"
)

func StrToBool(str string) bool {
	switch strings.ToLower(str) {
	case "true", "1", "t", "y", "yes":
		return true
	default:
		return false
	}
}

func CheckBool(str string) (bool, error) {
	switch strings.ToLower(str) {
	case "true", "1", "t", "y", "yes":
		return true, nil
	case "false", "0", "f", "n", "no":
		return false, nil
	default:
		return false, fmt.Errorf("cannot convert %q to boolean", str)
	}
}

func CamelToSnake(s string) string {
	var result strings.Builder
	runes := []rune(s)

	for i, r := range runes {
		if i > 0 && unicode.IsUpper(r) {
			// Only add underscore if previous char was NOT uppercase
			if !unicode.IsUpper(runes[i-1]) {
				result.WriteRune('_')
			}
		}
		result.WriteRune(unicode.ToLower(r))
	}
	return result.String()
}

func RemoveFromList(list []string, sub string) ([]string, bool) {
	found := false
	result := make([]string, 0, len(list))

	for _, i := range list {
		if i == sub {
			found = true
		} else {
			result = append(result, i)
		}
	}

	return result, found
}

func MergeUnique[T comparable](l1, l2 []T) []T {
	maxCapacity := len(l1) + len(l2)
	result := make([]T, 0, maxCapacity)
	seen := make(map[T]struct{}, maxCapacity)
	for _, item := range l1 {
		if _, exists := seen[item]; !exists {
			result = append(result, item)
			seen[item] = struct{}{}
		}
	}
	for _, item := range l2 {
		if _, exists := seen[item]; !exists {
			result = append(result, item)
			seen[item] = struct{}{}
		}
	}
	return result
}

func ParseTime(str string) (time.Time, error) {
	formats := []string{
		"2006-01-02 15:04:05Z07:00",
		"2006-01-02 15:04:05",
		"2006-01-02 15:04",
		"2006-01-02",
	}

	for _, format := range formats {
		if t, err := time.Parse(format, str); err == nil {
			return t, nil
		}
	}

	return time.Time{}, fmt.Errorf("invalid time format: %s", str)
}

func BatchProcess[T any, K any](
	batch []T, transform func(T) (K, error), maxWorkers int,
) ([]K, error) {
	var wg sync.WaitGroup
	results := make([]K, len(batch))
	errs := make([]error, len(batch))
	usedWorkers := make(chan struct{}, maxWorkers)

	for i := range batch {
		wg.Add(1)
		go func() {
			defer wg.Done()
			usedWorkers <- struct{}{}
			defer func() { <-usedWorkers }()
			processed, err := transform(batch[i])
			results[i] = processed
			errs[i] = err
		}()
	}

	wg.Wait()
	err := errors.Join(errs...)
	if err != nil {
		return results, fmt.Errorf("batch processing failed:\n%w", err)
	}

	return results, nil
}
