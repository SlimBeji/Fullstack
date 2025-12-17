package utils

import (
	"fmt"
	"regexp"
	"strings"
	"time"
)

func StrToBool(str string) bool {
	switch strings.ToLower(str) {
	case "true", "1", "t", "y", "yes":
		return true
	default:
		return false
	}
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

func RemoveReFromList(list []string, pattern string) ([]string, string) {
	re, err := regexp.Compile(pattern)
	if err != nil {
		return list, ""
	}

	match := ""
	result := make([]string, 0, len(list))

	for _, i := range list {
		if re.MatchString(i) {
			match = i
		} else {
			result = append(result, i)
		}
	}

	return result, match
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
