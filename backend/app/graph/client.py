from __future__ import annotations

import logging
from typing import Optional

from neo4j import GraphDatabase

from app.config import get_settings

logger = logging.getLogger(__name__)

_driver = None


def get_driver():
    global _driver
    if _driver is None:
        s = get_settings()
        _driver = GraphDatabase.driver(s.neo4j_uri, auth=(s.neo4j_user, s.neo4j_password))
        logger.info("Neo4j driver created → %s", s.neo4j_uri)
    return _driver


def close_driver():
    global _driver
    if _driver is not None:
        _driver.close()
        _driver = None
        logger.info("Neo4j driver closed")


def run_query(cypher: str, **params) -> list[dict]:
    driver = get_driver()
    with driver.session() as session:
        result = session.run(cypher, **params)
        return [record.data() for record in result]
