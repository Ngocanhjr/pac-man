"""Pydantic schemas cho request/response của API."""
from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


class SolveRequest(BaseModel):
    map: str = Field("small", description="Tên bản đồ trong thư mục maps/")
    algorithm: str = Field("bfs", description="bfs|dfs|ucs|greedy|astar")
    heuristic: str = Field("manhattan", description="Tên heuristic (chỉ dùng cho greedy/astar)")
    problem: str = Field("eat_all", description="eat_all | path_to_farthest")


class CompareRequest(BaseModel):
    map: str = "small"
    algorithms: List[str] = Field(default_factory=lambda: ["bfs", "ucs", "astar"])
    heuristic: str = "manhattan"
    problem: str = "eat_all"


class StatsResponse(BaseModel):
    nodes_expanded: int
    nodes_generated: int
    max_frontier: int
    time_ms: float
    path_length: int
    cost: float
    found: bool
