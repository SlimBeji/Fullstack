package static

import "fmt"

func GetImagePath(p string) string {
	return fmt.Sprintf("/app/internal/static/images/%s", p)
}
