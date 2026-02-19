from dataclasses import dataclass
from typing import Literal, Self

from sqlalchemy.orm import InstrumentedAttribute


@dataclass
class OrderBy:
    field: str
    order: Literal["ASC", "DESC"]

    @classmethod
    def from_string(cls, clause: str) -> Self:
        if clause.startswith("-"):
            return cls(field=clause[1:], order="DESC")
        return cls(clause, order="ASC")


@dataclass
class Join:
    relation: InstrumentedAttribute
    # the level of the join, used to sort the joins
    # and apply the parent<->child before child<->grandchild
    # use 1 for children and 2 for grand children for example
    level: int


@dataclass
class SelectField:
    # the field to select
    select: InstrumentedAttribute
    joins: list[Join] | None
