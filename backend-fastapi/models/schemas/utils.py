# Fields Metadata


def id_metadata(description: str = "", example: str = "") -> dict:
    description = description or "The ID, 24 hexadecimal characters"
    example = example or "683b21134e2e5d46978daf1f"
    return dict(
        min_length=24,
        max_length=24,
        pattern=r"^[0-9a-fA-F]{24}$",
        description=description,
        example=example,
    )
