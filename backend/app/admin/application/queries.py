import datetime
import logging
from dataclasses import dataclass
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.domain.tenant import Tenant, TenantRepository

logger = logging.getLogger(__name__)


@dataclass
class GetTenantsQuery:
    pass


async def handle_get_tenants(_query: GetTenantsQuery, repo: TenantRepository) -> list[Tenant]:
    logger.info("Executando consulta: GetTenantsQuery")
    results = await repo.find_all()
    logger.info("Resultado da consulta GetTenantsQuery: %s", results)
    return results


@dataclass
class GetGlobalAnalyticsQuery:
    limit: int = 5
    sort_by: str = "revenue"


async def handle_get_global_analytics(
    query: GetGlobalAnalyticsQuery,
    mongo_db: AsyncIOMotorDatabase[dict[str, Any]],
    tenants: list[Tenant],
    employee_counts: dict[str, int],
) -> dict[str, Any]:
    logger.info(
        "Executando consulta: GetGlobalAnalyticsQuery(limit=%s, sort_by=%r)",
        query.limit,
        query.sort_by,
    )

    now = datetime.datetime.now(datetime.UTC)
    start_of_month = datetime.datetime(now.year, now.month, 1, tzinfo=datetime.UTC)
    start_of_year = datetime.datetime(now.year, 1, 1, tzinfo=datetime.UTC)

    # 1. Monthly revenue pipeline
    pipeline_month = [
        {"$match": {"created_at": {"$gte": start_of_month}}},
        {"$group": {"_id": "$tenant_id", "revenue": {"$sum": "$total"}}},
    ]
    cursor_month = mongo_db["orders_read"].aggregate(pipeline_month)
    month_res = await cursor_month.to_list(length=None)
    month_revs = {str(item["_id"]): item.get("revenue", 0.0) for item in month_res}

    # 2. Yearly revenue pipeline
    pipeline_year = [
        {"$match": {"created_at": {"$gte": start_of_year}}},
        {"$group": {"_id": "$tenant_id", "revenue": {"$sum": "$total"}}},
    ]
    cursor_year = mongo_db["orders_read"].aggregate(pipeline_year)
    year_res = await cursor_year.to_list(length=None)
    year_revs = {str(item["_id"]): item.get("revenue", 0.0) for item in year_res}

    # 3. All-time stats pipeline (for sales count, overall revenue, and average ticket)
    pipeline_all = [
        {
            "$group": {
                "_id": "$tenant_id",
                "total_revenue": {"$sum": "$total"},
                "sales_count": {"$sum": 1},
            }
        }
    ]
    cursor_all = mongo_db["orders_read"].aggregate(pipeline_all)
    all_res = await cursor_all.to_list(length=None)
    all_time_stats = {
        str(item["_id"]): {
            "total_revenue": item.get("total_revenue", 0.0),
            "sales_count": item.get("sales_count", 0),
            "ticket_average": (
                item.get("total_revenue", 0.0) / item.get("sales_count", 1)
                if item.get("sales_count", 0) > 0
                else 0.0
            ),
        }
        for item in all_res
    }

    # 4. Overall average ticket across all franchises combined
    pipeline_overall = [
        {"$group": {"_id": None, "grand_revenue": {"$sum": "$total"}, "grand_count": {"$sum": 1}}}
    ]
    cursor_overall = mongo_db["orders_read"].aggregate(pipeline_overall)
    overall_res = await cursor_overall.to_list(length=None)
    if overall_res:
        grand_rev = overall_res[0].get("grand_revenue", 0.0)
        grand_count = overall_res[0].get("grand_count", 0)
        overall_average_ticket = grand_rev / grand_count if grand_count > 0 else 0.0
    else:
        overall_average_ticket = 0.0

    # Assemble stats for each tenant
    all_tenant_stats = []
    for t in tenants:
        t_id_str = str(t.id)
        stats_all = all_time_stats.get(
            t_id_str, {"total_revenue": 0.0, "sales_count": 0, "ticket_average": 0.0}
        )

        all_tenant_stats.append(
            {
                "id": t.id,
                "name": t.name,
                "plan_type": t.plan_type.value
                if hasattr(t.plan_type, "value")
                else str(t.plan_type),
                "is_active": t.is_active,
                "total_revenue": stats_all["total_revenue"],
                "month_revenue": month_revs.get(t_id_str, 0.0),
                "year_revenue": year_revs.get(t_id_str, 0.0),
                "sales_count": stats_all["sales_count"],
                "ticket_average": stats_all["ticket_average"],
                "employee_count": employee_counts.get(t_id_str, 0),
            }
        )

    logger.info("Resultado da consulta GetGlobalAnalyticsQuery: %s", all_tenant_stats)

    return {"tenants": all_tenant_stats, "overall_average_ticket": overall_average_ticket}
