"""Seed the Neo4j graph with agent/data/policy nodes and relationships."""
from __future__ import annotations

import logging

from app.graph.client import get_driver, close_driver

logger = logging.getLogger(__name__)

CLEAR_CYPHER = "MATCH (n) DETACH DELETE n"

SEED_CYPHER = """
CREATE (fm:Person  {slug: 'finance-manager', name: 'fm_agent',   role: 'Finance Manager'})
CREATE (acct:Person {slug: 'accountant',      name: 'acct_agent',  role: 'Accountant'})
CREATE (ceo:Person  {slug: 'ceo',             name: 'ceo_agent',   role: 'CEO'})

CREATE (pnl:DataResource      {id: 'pnl',      label: 'Profit & Loss Statement'})
CREATE (invoices:DataResource  {id: 'invoices', label: 'Invoices'})
CREATE (expenses:DataResource  {id: 'expenses', label: 'Expense Reports'})
CREATE (budget:DataResource    {id: 'budget',   label: 'Budget Forecast'})

CREATE (pnlPolicy:ApprovalPolicy {level: 'ceo', reason: 'P&L contains sensitive financial data requiring executive approval'})
CREATE (budgetPolicy:ApprovalPolicy {level: 'ceo', reason: 'Budget forecast requires executive sign-off'})

CREATE (fm)-[:MANAGES]->(acct)
CREATE (ceo)-[:MANAGES]->(fm)

CREATE (acct)-[:OWNS_DATA]->(pnl)
CREATE (acct)-[:OWNS_DATA]->(invoices)
CREATE (acct)-[:OWNS_DATA]->(expenses)
CREATE (fm)-[:OWNS_DATA]->(budget)

CREATE (fm)-[:CAN_REQUEST]->(pnl)
CREATE (fm)-[:CAN_REQUEST]->(invoices)
CREATE (fm)-[:CAN_REQUEST]->(expenses)
CREATE (fm)-[:CAN_REQUEST]->(budget)
CREATE (ceo)-[:CAN_REQUEST]->(pnl)
CREATE (ceo)-[:CAN_REQUEST]->(invoices)
CREATE (ceo)-[:CAN_REQUEST]->(expenses)
CREATE (ceo)-[:CAN_REQUEST]->(budget)
CREATE (acct)-[:CAN_REQUEST]->(pnl)
CREATE (acct)-[:CAN_REQUEST]->(invoices)
CREATE (acct)-[:CAN_REQUEST]->(expenses)

CREATE (pnl)-[:REQUIRES_APPROVAL]->(pnlPolicy)
CREATE (budget)-[:REQUIRES_APPROVAL]->(budgetPolicy)
"""


def seed():
    driver = get_driver()
    with driver.session() as session:
        session.run(CLEAR_CYPHER).consume()
        session.run(SEED_CYPHER).consume()
    logger.info("Neo4j graph seeded successfully")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    try:
        seed()
    finally:
        close_driver()
