
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("username", sa.String(60), nullable=True))
    op.add_column("users", sa.Column("bio", sa.String(160), nullable=True))
    op.add_column("users", sa.Column("location", sa.String(120), nullable=True))
    op.add_column(
        "users",
        sa.Column("theme", sa.String(16), nullable=False, server_default="dark"),
    )
    op.create_unique_constraint("uq_users_username", "users", ["username"])


def downgrade() -> None:
    op.drop_constraint("uq_users_username", "users", type_="unique")
    op.drop_column("users", "theme")
    op.drop_column("users", "location")
    op.drop_column("users", "bio")
    op.drop_column("users", "username")