"""initial schema

Revision ID: 0001
Revises:
Create Date: 2025-01-01 00:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "jobs",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("file_type", sa.String(32), nullable=False),
        sa.Column("file_size", sa.Integer, nullable=False),
        sa.Column("status", sa.String(16), nullable=False, default="QUEUED"),
        sa.Column("progress", sa.Integer, nullable=False, default=0),
        sa.Column("processing_type", sa.String(32), nullable=False),
        sa.Column("storage_key", sa.String(512), nullable=False),
        sa.Column("output_storage_key", sa.String(512), nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("retry_count", sa.Integer, nullable=False, default=0),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("started_at", sa.DateTime, nullable=True),
        sa.Column("completed_at", sa.DateTime, nullable=True),
    )

    op.create_table(
        "webhooks",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("url", sa.String(512), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, default=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("job_id", sa.Integer, sa.ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True),
        sa.Column("type", sa.String(32), nullable=False),
        sa.Column("message", sa.String(512), nullable=False),
        sa.Column("is_read", sa.Boolean, nullable=False, default=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("webhooks")
    op.drop_table("jobs")
    op.drop_table("users")