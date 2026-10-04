from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import sqlmodel

revision: str = "7639d6c804ce"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        "flight_plan",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("description", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("flight_plan_type", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("route_type", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("cruising_altitude", sa.Float(), nullable=True),
        sa.Column("departure_id", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("departure_name", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("destination_id", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("destination_name", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_flight_plan_departure_id"), "flight_plan", ["departure_id"], unique=False)
    op.create_index(op.f("ix_flight_plan_destination_id"), "flight_plan", ["destination_id"], unique=False)
    op.create_index(op.f("ix_flight_plan_title"), "flight_plan", ["title"], unique=False)

    op.create_table(
        "flight_plan_waypoint",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("flight_plan_id", sa.Uuid(), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("identifier", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("waypoint_type", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("altitude", sa.Float(), nullable=True),
        sa.Column("world_position", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.ForeignKeyConstraint(["flight_plan_id"], ["flight_plan.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_flight_plan_waypoint_flight_plan_id"), "flight_plan_waypoint", ["flight_plan_id"], unique=False)
    op.create_index(op.f("ix_flight_plan_waypoint_order_index"), "flight_plan_waypoint", ["order_index"], unique=False)

    op.create_table(
        "flight_telemetry",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Uuid(), nullable=False),
        sa.Column("flightplan_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("AIRSPEED_INDICATE", sa.Float(), nullable=False),
        sa.Column("ALTITUDE", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("VERTICAL_SPEED", sa.Float(), nullable=False),
        sa.Column("LATITUDE", sa.Float(), nullable=False),
        sa.Column("LONGITUDE", sa.Float(), nullable=False),
        sa.Column("MAGNETIC_COMPASS", sa.Float(), nullable=False),
        sa.Column("MAGVAR", sa.Float(), nullable=False),
        sa.Column("AUTOPILOT_MASTER", sa.Float(), nullable=False),
        sa.Column("AUTOPILOT_AIRSPEED_HOLD", sa.Float(), nullable=False),
        sa.Column("AUTOPILOT_AIRSPEED_HOLD_VAR", sa.Float(), nullable=False),
        sa.Column("AUTOPILOT_ALTITUDE_LOCK", sa.Float(), nullable=False),
        sa.Column("AUTOPILOT_ALTITUDE_LOCK_VAR", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("AUTOPILOT_APPROACH_HOLD", sa.Float(), nullable=False),
        sa.Column("AUTOPILOT_ATTITUDE_HOLD", sa.Float(), nullable=False),
        sa.Column("AUTOPILOT_BACKCOURSE_HOLD", sa.Float(), nullable=False),
        sa.Column("AUTOPILOT_FLIGHT_DIRECTOR_ACTIVE", sa.Float(), nullable=False),
        sa.Column("AUTOPILOT_GLIDESLOPE_HOLD", sa.Float(), nullable=False),
        sa.Column("AUTOPILOT_HEADING_LOCK", sa.Float(), nullable=False),
        sa.Column("AUTOPILOT_HEADING_LOCK_DIR", sa.Float(), nullable=False),
        sa.Column("AUTOPILOT_NAV_SELECTED", sa.Float(), nullable=False),
        sa.Column("AUTOPILOT_PITCH_HOLD", sa.Float(), nullable=False),
        sa.Column("AUTOPILOT_PITCH_HOLD_REF", sa.Float(), nullable=False),
        sa.Column("AUTOPILOT_VERTICAL_HOLD", sa.Float(), nullable=False),
        sa.Column("AUTOPILOT_VERTICAL_HOLD_VAR", sa.Float(), nullable=False),
        sa.Column("AUTOPILOT_WING_LEVELER", sa.Float(), nullable=False),
        sa.Column("ELEVATOR_TRIM_PCT", sa.Float(), nullable=False),
        sa.Column("RUDDER_TRIM_PCT", sa.Float(), nullable=False),
        sa.Column("FLAPS_HANDLE_PERCENT", sa.Float(), nullable=False),
        sa.Column("GEAR_HANDLE_POSITION", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("FUEL_PERCENTAGE", sa.Float(), nullable=False),
        sa.Column("CABIN_NO_SMOKING_ALERT_SWITCH", sa.Float(), nullable=False),
        sa.Column("CABIN_SEATBELTS_ALERT_SWITCH", sa.Float(), nullable=False),
        sa.Column("STATUS", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.ForeignKeyConstraint(["flightplan_id"], ["flight_plan.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_flight_telemetry_flightplan_id"), "flight_telemetry", ["flightplan_id"], unique=False)
    op.create_index(op.f("ix_flight_telemetry_session_id"), "flight_telemetry", ["session_id"], unique=False)

def downgrade() -> None:
    op.drop_index(op.f("ix_flight_telemetry_session_id"), table_name="flight_telemetry")
    op.drop_index(op.f("ix_flight_telemetry_flightplan_id"), table_name="flight_telemetry")
    op.drop_table("flight_telemetry")
    op.drop_index(op.f("ix_flight_plan_waypoint_order_index"), table_name="flight_plan_waypoint")
    op.drop_index(op.f("ix_flight_plan_waypoint_flight_plan_id"), table_name="flight_plan_waypoint")
    op.drop_table("flight_plan_waypoint")
    op.drop_index(op.f("ix_flight_plan_title"), table_name="flight_plan")
    op.drop_index(op.f("ix_flight_plan_destination_id"), table_name="flight_plan")
    op.drop_index(op.f("ix_flight_plan_departure_id"), table_name="flight_plan")
    op.drop_table("flight_plan")

