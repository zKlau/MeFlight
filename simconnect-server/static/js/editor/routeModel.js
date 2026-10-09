import { NEW_WAYPOINT_PREFIX, USER_TYPE } from "./editorConsts.js";

const NONE = -1;

const toEditable = (waypoint) => ({
  identifier: waypoint.identifier,
  waypoint_type: waypoint.waypoint_type,
  latitude: waypoint.latitude,
  longitude: waypoint.longitude,
  altitude: waypoint.altitude,
});

export const createRouteModel = () => {
  const listeners = new Set();
  const state = { planId: null, waypoints: [], selected: NONE, dirty: false };

  const notify = () => listeners.forEach((listener) => listener(state));

  const change = (mutation) => {
    mutation();
    state.dirty = true;
    notify();
  };

  const uniqueIdentifier = () => {
    const taken = new Set(state.waypoints.map((waypoint) => waypoint.identifier));
    let number = state.waypoints.length + 1;

    while (taken.has(`${NEW_WAYPOINT_PREFIX}${number}`)) {
      number += 1;
    }

    return `${NEW_WAYPOINT_PREFIX}${number}`;
  };

  const load = (planId, waypoints) => {
    state.planId = planId;
    state.waypoints = waypoints.map(toEditable);
    state.selected = NONE;
    state.dirty = false;
    notify();
  };

  const clear = () => load(null, []);

  const select = (index) => {
    state.selected = index;
    notify();
  };

  const update = (index, fields) => change(() => Object.assign(state.waypoints[index], fields));

  const insert = (index, latitude, longitude) =>
    change(() => {
      state.waypoints.splice(index, 0, {
        identifier: uniqueIdentifier(),
        waypoint_type: USER_TYPE,
        latitude,
        longitude,
        altitude: null,
      });
      state.selected = index;
    });

  const remove = (index) =>
    change(() => {
      state.waypoints.splice(index, 1);
      state.selected = Math.min(index, state.waypoints.length - 1);
    });

  const swap = (index, otherIndex) => {
    if (otherIndex < 0 || otherIndex >= state.waypoints.length) {
      return;
    }

    change(() => {
      const moved = state.waypoints[index];
      state.waypoints[index] = state.waypoints[otherIndex];
      state.waypoints[otherIndex] = moved;
      state.selected = otherIndex;
    });
  };

  const markSaved = () => {
    state.dirty = false;
    notify();
  };

  const subscribe = (listener) => listeners.add(listener);

  return { state, load, clear, select, update, insert, remove, swap, markSaved, subscribe };
};
