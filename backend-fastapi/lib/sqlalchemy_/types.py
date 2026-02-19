from dataclasses import dataclass
from typing import Literal, Self

from sqlalchemy.orm import InstrumentedAttribute, load_only, selectinload


@dataclass
class OrderBy:
    """Utility class for modeling an order by"""

    field: str
    order: Literal["ASC", "DESC"]

    @classmethod
    def from_string(cls, clause: str) -> Self:
        if clause.startswith("-"):
            return cls(field=clause[1:], order="DESC")
        return cls(clause, order="ASC")


@dataclass
class Join:
    """Utility class for modeling a join"""

    relation: InstrumentedAttribute
    # the level of the join, used to sort the joins
    # and apply the parent<->child before child<->grandchild
    # use 1 for children and 2 for grand children for example
    level: int


@dataclass
class SelectField:
    """Utility class for defining how a field is fetched"""

    # the field to select
    select: InstrumentedAttribute
    joins: list[Join] | None

    @property
    def tablename(self) -> str:
        return self.select.property.mapper.class_.__tablename__


@dataclass
class TableSelection:
    """Utility class for hadnling selection load"""

    table_name: str  # Empty string for main entity
    fields: set[InstrumentedAttribute]
    path: list[InstrumentedAttribute]  # Empty for main entity

    def to_selection_load(self):
        """Convert to SQLAlchemy load option"""
        if self.table_name == "":
            # Main entity - just load_only
            return load_only(*self.fields)

        # Relationship - chain selectinload
        option = selectinload(self.path[0])
        for relation in self.path[1:]:
            option = option.selectinload(relation)
        return option.load_only(*self.fields)
