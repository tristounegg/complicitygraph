from neomodel import (
    BooleanProperty,
    DateTimeProperty,
    IntegerProperty,
    StringProperty,
    StructuredNode,
    UniqueIdProperty,
)


class Country(StructuredNode):
    code = StringProperty(unique_index=True, required=True)


class Accomplice(StructuredNode):
    wdid = UniqueIdProperty()
    instance_of = StringProperty()
    label = StringProperty()
    base = BooleanProperty()
    link_count = IntegerProperty()
    # used by PIXI.Container on the frontend
    group = IntegerProperty()
    updated_at = DateTimeProperty()
