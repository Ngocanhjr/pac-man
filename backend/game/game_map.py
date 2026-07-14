from dataclasses import dataclass
from typing import FrozenSet

from .state import Position, Maze

@dataclass(frozen=True)
class GameMap:
    """Dữ liệu map ban đầu đọc từ file.

    Không phải state của thuật toán tìm kiếm.
    Mỗi SearchProblem dùng dữ liệu này để tạo initial state phù hợp.
    """
    maze: Maze  # mê cung
    pacman_start: Position  # vị trí ban đầu của Pacman
    initial_food: FrozenSet[Position]  # tập hợp các vị trí thức ăn ban đầu
    
    