import json
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Dict, Optional, Tuple
from fastapi import HTTPException, status
from schemas.widgets import MetarResponse

METAR_URL = "https://aviationweather.gov/api/data/metar?ids={ident}&format=json"
REQUEST_TIMEOUT_SECONDS = 10
CACHE_SECONDS = 600
USER_AGENT = "MeFlight/1.0"
NOT_FOUND_DETAIL = "No METAR available for this airport"
UPSTREAM_DETAIL = "Weather service unavailable"

_cache: Dict[str, Tuple[float, MetarResponse]] = {}

def _fetch(ident: str) -> list:
    request = urllib.request.Request(METAR_URL.format(ident=ident), headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        payload = response.read()
    if not payload:
        return []
    return json.loads(payload)

def _optional_text(value) -> Optional[str]:
    if value is None:
        return None
    return str(value)

def _observed_at(timestamp) -> Optional[datetime]:
    if timestamp is None:
        return None
    return datetime.fromtimestamp(timestamp, tz=timezone.utc)

def _to_response(ident: str, report: dict) -> MetarResponse:
    return MetarResponse(
        ident=report.get("icaoId", ident),
        name=report.get("name"),
        raw=report.get("rawOb", ""),
        observed_at=_observed_at(report.get("obsTime")),
        wind_direction=_optional_text(report.get("wdir")),
        wind_speed_kt=report.get("wspd"),
        wind_gust_kt=report.get("wgst"),
        visibility=_optional_text(report.get("visib")),
        temperature_c=report.get("temp"),
        dewpoint_c=report.get("dewp"),
        altimeter_hpa=report.get("altim"),
        cover=report.get("cover"),
        flight_category=report.get("fltCat"),
    )

def get_metar(ident: str) -> MetarResponse:
    key = ident.upper()
    cached = _cache.get(key)
    if cached and time.monotonic() - cached[0] < CACHE_SECONDS:
        return cached[1]

    try:
        reports = _fetch(key)
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError) as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=UPSTREAM_DETAIL) from error

    if not reports:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND_DETAIL)

    result = _to_response(key, reports[0])
    _cache[key] = (time.monotonic(), result)
    return result
