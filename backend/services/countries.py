import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import List, Optional
from shapely import STRtree
from shapely.geometry import Point, shape
from shapely.prepared import prep
from services.geo import Coordinate

COUNTRIES_FILE = Path(__file__).resolve().parent.parent / "data" / "countries.geojson"

@dataclass(frozen=True)
class Country:
    code: str
    name: str

class CountryIndex:
    def __init__(self, features: List[dict]):
        self._countries = [Country(code=f["properties"]["code"], name=f["properties"]["name"]) for f in features]
        geometries = [shape(feature["geometry"]) for feature in features]
        self._prepared = [prep(geometry) for geometry in geometries]
        self._tree = STRtree(geometries)
        self._by_code = {country.code: country for country in self._countries}

    def locate(self, position: Coordinate) -> Optional[Country]:
        latitude, longitude = position
        point = Point(longitude, latitude)
        for index in self._tree.query(point):
            if self._prepared[index].contains(point):
                return self._countries[index]
        return None

    def by_code(self, code: str) -> Optional[Country]:
        return self._by_code.get(code)

@lru_cache(maxsize=1)
def country_index() -> CountryIndex:
    with COUNTRIES_FILE.open(encoding="utf-8") as handle:
        return CountryIndex(json.load(handle)["features"])
