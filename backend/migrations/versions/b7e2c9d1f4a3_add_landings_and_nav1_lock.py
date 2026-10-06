from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import sqlmodel

revision: str = "b7e2c9d1f4a3"
down_revision: Union[str, Sequence[str], None] = "a1f3c2d4e5b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TELEMETRY_TABLE = "flight_telemetry"
LANDING_TABLE = "landing"

def upgrade() -> None:
    op.add_column(TELEMETRY_TABLE, sa.Column("AUTOPILOT_NAV1_LOCK", sa.Float(), nullable=False, server_default="0"))
    op.create_table(
        LANDING_TABLE,
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("flightplan_id", sa.Uuid(), nullable=True),
        sa.Column("session_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("rate_fpm", sa.Float(), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("airport_ident", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("airport_name", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.ForeignKeyConstraint(["flightplan_id"], ["flight_plan.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_landing_flightplan_id"), LANDING_TABLE, ["flightplan_id"], unique=False)
    op.create_index(op.f("ix_landing_created_at"), LANDING_TABLE, ["created_at"], unique=False)

def downgrade() -> None:
    op.drop_index(op.f("ix_landing_created_at"), table_name=LANDING_TABLE)
    op.drop_index(op.f("ix_landing_flightplan_id"), table_name=LANDING_TABLE)
    op.drop_table(LANDING_TABLE)
    op.drop_column(TELEMETRY_TABLE, "AUTOPILOT_NAV1_LOCK")
