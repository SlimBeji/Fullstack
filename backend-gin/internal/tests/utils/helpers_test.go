package tests

import (
	"backend/internal/lib/utils"
	"reflect"
	"testing"
)

func TestRemoveFromList(t *testing.T) {
	list := []string{"a", "b", "c"}

	// Test case 1: Item not found
	newList, found := utils.RemoveFromList(list, "d")
	if found {
		t.Errorf("Expected false got true")
	}
	if !reflect.DeepEqual(newList, list) {
		t.Errorf("Expected original list when item not found")
	}

	// Test case 2: Item found
	newList, found = utils.RemoveFromList(list, "b")
	if !found {
		t.Errorf("Expected true got false")
	}
	expected := []string{"a", "c"}
	if !reflect.DeepEqual(newList, expected) {
		t.Errorf("RemoveFromList did not remove item 'b'. Got %v, expected %v", newList, expected)
	}

	// Test case 3: Original slice unchanged (important!)
	if !reflect.DeepEqual(list, []string{"a", "b", "c"}) {
		t.Errorf("Original slice was modified")
	}
}
