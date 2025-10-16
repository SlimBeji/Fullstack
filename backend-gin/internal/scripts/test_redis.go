package scripts

import (
	"backend/internal/lib/clients"
	"fmt"
)

func TestRedis() {
	clients.Redis.Set("secret_number", 158)
	result, _ := clients.Redis.Get("secret_number")
	fmt.Println(result)
	clients.Redis.Delete("secret_number")
	result, _ = clients.Redis.Get("secret_number")
	fmt.Println(result)
}
