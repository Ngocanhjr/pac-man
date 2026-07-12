"""Luật di chuyển Pac-man cho các bài toán tìm kiếm tĩnh."""
from __future__ import annotations

from dataclasses import replace
from typing import List

from .state import Direction, GameState, MOVES, Position, Status

FOOD_REWARD = 10
PELLET_REWARD = 50
STEP_COST = 1          # phạt mỗi bước (score game thực trừ 1 mỗi bước)
WIN_REWARD = 500


def _add(pos: Position, d: Direction) -> Position:
    dr, dc = MOVES[d]
    r, c = pos
    return (r + dr, c + dc)


def legal_actions(state: GameState, pos: Position) -> List[Direction]:
    """Các hướng đi không đâm vào tường / không ra ngoài bản đồ, tính từ `pos`."""
    actions: List[Direction] = []
    for d in (Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT):
        nxt = _add(pos, d)
        if state.in_bounds(nxt) and not state.is_wall(nxt):
            actions.append(d)
    return actions


def pacman_legal_actions(state: GameState) -> List[Direction]:
    return legal_actions(state, state.pacman)


def move_pacman(state: GameState, action: Direction) -> GameState:
    """Di chuyển Pac-man 1 bước, xử lý ăn food/pellet và cập nhật điểm.

    Ma không tham gia transition của bài toán tĩnh.
    """
    new_pos = _add(state.pacman, action)
    if not state.in_bounds(new_pos) or state.is_wall(new_pos):
        new_pos = state.pacman  # action không hợp lệ -> đứng yên

    food = state.food
    pellets = state.power_pellets
    score = state.score - STEP_COST
    if new_pos in food:
        food = food - {new_pos}
        score += FOOD_REWARD
    if new_pos in pellets:
        pellets = pellets - {new_pos}
        score += PELLET_REWARD

    status = state.status
    if not food:
        status = Status.WIN
        score += WIN_REWARD

    return replace(
        state,
        pacman=new_pos,
        food=food,
        power_pellets=pellets,
        score=score,
        status=status,
    )


def is_goal_static(state: GameState) -> bool:
    """Goal của bài toán tĩnh: ăn hết thức ăn."""
    return len(state.food) == 0
