import logging
import sys


def configure_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        '{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}'
    )
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.INFO)