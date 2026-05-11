package utils

import (
	"errors"
	"fmt"
	"sync"
)

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
