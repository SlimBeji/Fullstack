package tests

import "testing"

func TestX(t *testing.T) {
	x := 3 + 6
	if x != 9 {
		t.Errorf("Expected 9, got %d", x)
	}
}
