from dataclasses import dataclass
from typing import List
from services.geo import haversine_m, meters_to_nm
from services.telemetry_samples import TelemetrySample
from services.track_builder import is_same_segment

SECONDS_PER_HOUR = 3600
MIN_RATE_DISTANCE_NM = 20.0
RATE_DECIMALS = 3
GALLONS_DECIMALS = 1

@dataclass(frozen=True)
class FuelUsage:
    burned_gallons: float
    gallons_per_nm: float
    gallons_per_hour: float

def _counts_toward_burn(previous: TelemetrySample, sample: TelemetrySample) -> bool:
    airborne = not (previous.on_ground and sample.on_ground)
    has_fuel = previous.fuel_quantity > 0 and sample.fuel_quantity > 0
    return airborne and has_fuel and is_same_segment(previous, sample)

def fuel_usage(samples: List[TelemetrySample]) -> FuelUsage:
    burned = 0.0
    meters = 0.0
    seconds = 0.0

    for previous, sample in zip(samples, samples[1:]):
        if not _counts_toward_burn(previous, sample):
            continue
        burned += max(0.0, previous.fuel_quantity - sample.fuel_quantity)
        meters += haversine_m(previous.position, sample.position)
        seconds += (sample.created_at - previous.created_at).total_seconds()

    nautical_miles = meters_to_nm(meters)
    if nautical_miles < MIN_RATE_DISTANCE_NM or seconds == 0:
        return FuelUsage(burned_gallons=round(burned, GALLONS_DECIMALS), gallons_per_nm=0.0, gallons_per_hour=0.0)

    return FuelUsage(
        burned_gallons=round(burned, GALLONS_DECIMALS),
        gallons_per_nm=round(burned / nautical_miles, RATE_DECIMALS),
        gallons_per_hour=round(burned / seconds * SECONDS_PER_HOUR, GALLONS_DECIMALS),
    )
