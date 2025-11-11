from typing import Any, Iterator


def str_to_bool(val: str) -> bool:
    return val.lower() in ("true", "1", "t", "y", "yes")


def parse_dot_notation(data: dict[str, Any]) -> dict[str, Any]:
    result: dict[str, Any] = {}

    for dot_key, value in data.items():
        parts = dot_key.split(".")
        current = result

        for part in parts[:-1]:
            if part not in current or not isinstance(current[part], dict):
                current[part] = {}
            current = current[part]

        last_part = parts[-1]
        current[last_part] = value

    return result


def flatten_json(
    obj: dict[str, Any] | list, accept_arrays: bool = False, prefix: str = ""
) -> dict[str, Any]:
    result: dict[str, Any] = {}

    enumerator: Iterator[tuple[Any, Any]] = iter(
        obj.items() if isinstance(obj, dict) else enumerate(obj)
    )

    for key, value in enumerator:
        new_key = f"{prefix}.{key}" if prefix else str(key)

        if isinstance(value, list):
            if not accept_arrays:
                raise ValueError(
                    f"Array encountered at path '{new_key}' but arrays are not allowed"
                )

            for index, item in enumerate(value):
                if isinstance(item, dict) or isinstance(item, list):
                    result.update(
                        flatten_json(item, accept_arrays, f"{new_key}.{index}")
                    )
                else:
                    result[f"{new_key}.{index}"] = item

        elif isinstance(value, dict):
            result.update(flatten_json(value, accept_arrays, new_key))

        else:
            result[new_key] = value

    return result


def get_image_path(p: str) -> str:
    return f"/app/static/images/{p}"
