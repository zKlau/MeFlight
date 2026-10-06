from typing import Sequence, Union
from alembic import op

revision: str = "c4d8e1a2b9f0"
down_revision: Union[str, Sequence[str], None] = "b7e2c9d1f4a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = "flight_telemetry"
INDEX = "ix_flight_telemetry_created_at_id"

def upgrade() -> None:
    op.create_index(INDEX, TABLE, ["created_at", "id"], unique=False)

def downgrade() -> None:
    op.drop_index(INDEX, table_name=TABLE)
