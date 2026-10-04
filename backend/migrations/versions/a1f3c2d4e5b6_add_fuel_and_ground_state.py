from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "a1f3c2d4e5b6"
down_revision: Union[str, Sequence[str], None] = "7639d6c804ce"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = "flight_telemetry"
PLAN_TIME_INDEX = "ix_flight_telemetry_flightplan_id_created_at"

def upgrade() -> None:
    op.add_column(TABLE, sa.Column("FUEL_TOTAL_QUANTITY", sa.Float(), nullable=False, server_default="0"))
    op.add_column(TABLE, sa.Column("FUEL_TANK_LEVELS", sa.JSON(), nullable=False, server_default="{}"))
    op.add_column(TABLE, sa.Column("SIM_ON_GROUND", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column(TABLE, sa.Column("GROUND_VELOCITY", sa.Float(), nullable=False, server_default="0"))
    op.add_column(TABLE, sa.Column("PLANE_HEADING_DEGREES_TRUE", sa.Float(), nullable=False, server_default="0"))
    op.create_index(PLAN_TIME_INDEX, TABLE, ["flightplan_id", "created_at"], unique=False)

def downgrade() -> None:
    op.drop_index(PLAN_TIME_INDEX, table_name=TABLE)
    op.drop_column(TABLE, "PLANE_HEADING_DEGREES_TRUE")
    op.drop_column(TABLE, "GROUND_VELOCITY")
    op.drop_column(TABLE, "SIM_ON_GROUND")
    op.drop_column(TABLE, "FUEL_TANK_LEVELS")
    op.drop_column(TABLE, "FUEL_TOTAL_QUANTITY")
