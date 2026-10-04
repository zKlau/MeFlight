from dataclasses import dataclass
from typing import Optional, List, Dict, Any
import re
import xml.etree.ElementTree as ET

_AIRPORTS_CACHE: Optional[Dict[str, Any]] = None

def _get_airports_db() -> Dict[str, Any]:
    global _AIRPORTS_CACHE
    if _AIRPORTS_CACHE is None:
        try:
            import airportsdata
            icao = airportsdata.load("ICAO")
            iata = airportsdata.load("IATA")
            combined = {}
            combined.update(iata)
            combined.update(icao)
            _AIRPORTS_CACHE = combined
        except Exception:
            _AIRPORTS_CACHE = {}
    return _AIRPORTS_CACHE

@dataclass
class ParsedWaypoint:
    order_index: int
    identifier: str
    waypoint_type: Optional[str]
    latitude: float
    longitude: float
    altitude: Optional[float]
    world_position: Optional[str]

@dataclass
class ParsedFlightPlan:
    title: Optional[str]
    description: Optional[str]
    flight_plan_type: Optional[str]
    route_type: Optional[str]
    cruising_altitude: Optional[float]
    departure_id: Optional[str]
    departure_name: Optional[str]
    destination_id: Optional[str]
    destination_name: Optional[str]
    waypoints: List[ParsedWaypoint]

def parse_coordinate_part(part: str) -> float:
    cleaned = part.strip()
    match = re.search(
        r'([NSEW])?\s*([+-]?\d+(?:\.\d+)?)(?:[°*d\s]\s*(\d+(?:\.\d+)?))?(?:[\'\s]\s*(\d+(?:\.\d+)?))?[\"\']?\s*([NSEW])?',
        cleaned,
        re.IGNORECASE,
    )
    if not match:
        return float(cleaned)

    hemisphere = (match.group(1) or match.group(5) or "").upper()
    val1 = float(match.group(2))
    val2 = float(match.group(3)) if match.group(3) else 0.0
    val3 = float(match.group(4)) if match.group(4) else 0.0

    decimal = abs(val1) + (val2 / 60.0) + (val3 / 3600.0)
    if val1 < 0 or hemisphere in ("S", "W"):
        decimal = -decimal
    return decimal

def parse_world_position(pos_str: str) -> tuple[float, float, Optional[float]]:
    parts = [p.strip() for p in pos_str.split(",") if p.strip()]
    if not parts:
        raise ValueError("Empty world position string")

    lat = parse_coordinate_part(parts[0]) if len(parts) > 0 else 0.0
    lon = parse_coordinate_part(parts[1]) if len(parts) > 1 else 0.0
    alt = None
    if len(parts) > 2:
        try:
            alt_clean = re.sub(r"[^\d.-]", "", parts[2])
            if alt_clean:
                alt = float(alt_clean)
        except ValueError:
            alt = None

    return lat, lon, alt

def _get_local_tag(element: ET.Element) -> str:
    return element.tag.split("}")[-1]

def _get_child_text(parent: ET.Element, target_tag: str) -> Optional[str]:
    target_lower = target_tag.lower()
    for child in parent:
        if _get_local_tag(child).lower() == target_lower:
            return child.text.strip() if child.text else None
    return None

AIRPORT_WAYPOINT_TYPE = "Airport"

def _endpoint_airport(ident: Optional[str], lla: Optional[str], airports_db: Dict[str, Any]) -> Optional[ParsedWaypoint]:
    if not ident:
        return None

    if lla:
        lat, lon, alt = parse_world_position(lla)
        return ParsedWaypoint(0, ident, AIRPORT_WAYPOINT_TYPE, lat, lon, alt, lla)

    airport_info = airports_db.get(ident.upper())
    if airport_info is None:
        return None

    lat = float(airport_info["lat"])
    lon = float(airport_info["lon"])
    elevation = airport_info.get("elevation")
    alt = float(elevation) if elevation is not None else None
    return ParsedWaypoint(0, ident, AIRPORT_WAYPOINT_TYPE, lat, lon, alt, f"{lat},{lon},{alt or 0.0}")

def _with_endpoint_airports(
    waypoints: List[ParsedWaypoint],
    departure: Optional[ParsedWaypoint],
    destination: Optional[ParsedWaypoint],
) -> List[ParsedWaypoint]:
    result = list(waypoints)

    if departure and (not result or result[0].identifier != departure.identifier):
        result.insert(0, departure)

    if destination and result[-1].identifier != destination.identifier:
        result.append(destination)

    for index, waypoint in enumerate(result):
        waypoint.order_index = index

    return result

def parse_msfs_pln(xml_content: str | bytes) -> ParsedFlightPlan:
    if isinstance(xml_content, bytes):
        xml_content = xml_content.decode("utf-8", errors="replace")

    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as exc:
        raise ValueError(f"Invalid XML flight plan: {exc}") from exc

    fp_element = None
    for el in root.iter():
        if _get_local_tag(el).lower() == "flightplan.flightplan":
            fp_element = el
            break

    if fp_element is None:
        fp_element = root

    title = _get_child_text(fp_element, "Title")
    fp_type = _get_child_text(fp_element, "FPType")
    route_type = _get_child_text(fp_element, "RouteType")
    cruising_alt_str = _get_child_text(fp_element, "CruisingAlt")
    departure_id = _get_child_text(fp_element, "DepartureID")
    departure_name = _get_child_text(fp_element, "DepartureName")
    destination_id = _get_child_text(fp_element, "DestinationID")
    destination_name = _get_child_text(fp_element, "DestinationName")
    descr = _get_child_text(root, "Descr") or _get_child_text(fp_element, "Descr")

    cruising_alt = None
    if cruising_alt_str:
        try:
            cruising_alt = float(re.sub(r"[^\d.-]", "", cruising_alt_str))
        except ValueError:
            cruising_alt = None

    airports_db = _get_airports_db()
    parsed_waypoints: List[ParsedWaypoint] = []
    order_idx = 0

    for el in fp_element.iter():
        if _get_local_tag(el).lower() == "atcwaypoint":
            ident = el.attrib.get("id")
            if not ident:
                ident = _get_child_text(el, "id")
            if not ident:
                for child in el.iter():
                    if _get_local_tag(child).lower() == "icaoident":
                        ident = child.text.strip() if child.text else None
                        break
            if not ident:
                ident = f"WPT{order_idx + 1}"

            wpt_type = _get_child_text(el, "ATCWaypointType")
            pos_str = _get_child_text(el, "WorldPosition")

            if not pos_str and ident == departure_id:
                pos_str = _get_child_text(fp_element, "DepartureLLA")
            elif not pos_str and ident == destination_id:
                pos_str = _get_child_text(fp_element, "DestinationLLA")

            lat = 0.0
            lon = 0.0
            alt = None

            if pos_str:
                lat, lon, alt = parse_world_position(pos_str)
            elif ident and ident.upper() in airports_db:
                airport_info = airports_db[ident.upper()]
                lat = float(airport_info["lat"])
                lon = float(airport_info["lon"])
                elev = airport_info.get("elevation")
                alt = float(elev) if elev is not None else None
                pos_str = f"{lat},{lon},{alt if alt is not None else 0.0}"
            else:
                continue

            alt_fp_str = _get_child_text(el, "AltFP")
            if alt_fp_str and alt is None:
                try:
                    alt = float(re.sub(r"[^\d.-]", "", alt_fp_str))
                except ValueError:
                    pass

            parsed_waypoints.append(
                ParsedWaypoint(
                    order_index=order_idx,
                    identifier=ident,
                    waypoint_type=wpt_type,
                    latitude=lat,
                    longitude=lon,
                    altitude=alt,
                    world_position=pos_str,
                )
            )
            order_idx += 1

    parsed_waypoints = _with_endpoint_airports(
        parsed_waypoints,
        _endpoint_airport(departure_id, _get_child_text(fp_element, "DepartureLLA"), airports_db),
        _endpoint_airport(destination_id, _get_child_text(fp_element, "DestinationLLA"), airports_db),
    )

    return ParsedFlightPlan(
        title=title,
        description=descr,
        flight_plan_type=fp_type,
        route_type=route_type,
        cruising_altitude=cruising_alt,
        departure_id=departure_id,
        departure_name=departure_name,
        destination_id=destination_id,
        destination_name=destination_name,
        waypoints=parsed_waypoints,
    )

