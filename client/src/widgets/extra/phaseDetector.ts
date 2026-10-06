import { PHASE_LIMITS, PHASES, type Phase } from "../../consts/extraWidgets";
import type { AircraftTelemetry } from "../../types";
import { groundSpeedKts } from "../routeMetrics";

const GEAR_DOWN = "DOWN";

const isConfiguredForLanding = (live: AircraftTelemetry) =>
  live.GEAR_HANDLE_POSITION === GEAR_DOWN || live.FLAPS_HANDLE_PERCENT > 0;

const airbornePhase = (live: AircraftTelemetry): Phase => {
  if (live.VERTICAL_SPEED > PHASE_LIMITS.climbMinFpm) {
    return PHASES.climb;
  }

  if (live.VERTICAL_SPEED < PHASE_LIMITS.descentMaxFpm && isConfiguredForLanding(live)) {
    return PHASES.approach;
  }

  if (live.VERTICAL_SPEED < PHASE_LIMITS.descentMaxFpm) {
    return PHASES.descent;
  }

  return PHASES.cruise;
};

const groundPhase = (live: AircraftTelemetry): Phase => {
  const speed = groundSpeedKts(live);

  if (speed <= PHASE_LIMITS.parkedMaxGroundSpeedKts) {
    return PHASES.parked;
  }

  if (speed <= PHASE_LIMITS.taxiMaxGroundSpeedKts) {
    return PHASES.taxi;
  }

  return PHASES.takeoff;
};

export const createPhaseDetector = () => {
  let lastAirborneAt = 0;
  let lastGroundAt = 0;

  const onGround = (live: AircraftTelemetry, now: number): Phase => {
    lastGroundAt = now;

    if (now - lastAirborneAt < PHASE_LIMITS.landedWindowMs) {
      return PHASES.landed;
    }

    return groundPhase(live);
  };

  const inAir = (live: AircraftTelemetry, now: number): Phase => {
    lastAirborneAt = now;

    if (now - lastGroundAt < PHASE_LIMITS.takeoffWindowMs) {
      return PHASES.takeoff;
    }

    return airbornePhase(live);
  };

  return (live: AircraftTelemetry): Phase => {
    const now = Date.now();

    if (live.SIM_ON_GROUND) {
      return onGround(live, now);
    }

    return inAir(live, now);
  };
};
