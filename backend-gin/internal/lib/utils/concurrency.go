package utils

import (
	"errors"
	"fmt"
	"sync"
)

func BatchProcessInChunks[T any, K any](
	batch []T, transform func(T) (K, error), chunkSize int,
) ([]K, error) {
	results := make([]K, len(batch))
	errs := make([]error, len(batch))

	for start := 0; start < len(batch); start += chunkSize {
		end := min(start+chunkSize, len(batch))
		chunk := batch[start:end]

		var wg sync.WaitGroup
		for i, item := range chunk {
			wg.Add(1)
			go func() {
				defer wg.Done()
				globalIdx := start + i
				processed, err := transform(item)
				results[globalIdx] = processed
				errs[globalIdx] = err
			}()
		}
		wg.Wait()
	}

	err := errors.Join(errs...)
	if err != nil {
		return results, fmt.Errorf("batch processing failed:\n%w", err)
	}

	return results, nil
}

func BatchProcessWithSemaphore[T any, K any](
	batch []T, transform func(T) (K, error), maxWorkers int,
) ([]K, error) {
	var wg sync.WaitGroup
	results := make([]K, len(batch))
	errs := make([]error, len(batch))
	usedWorkers := make(chan struct{}, maxWorkers)

	for i, item := range batch {
		wg.Add(1)
		go func() {
			defer wg.Done()
			usedWorkers <- struct{}{}
			defer func() { <-usedWorkers }()
			processed, err := transform(item)
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
