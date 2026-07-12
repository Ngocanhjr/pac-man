# Kế hoạch và phạm vi thực tế: Pac-man AI Search

## 1. Yêu cầu đề tài

Đề bài yêu cầu phân tích không gian trạng thái Pac-man, dùng tìm kiếm mù và tìm kiếm có thông tin, rồi so sánh ưu/khuyết điểm. Ngôn ngữ triển khai không bị giới hạn.

Phạm vi đã chốt:

- Backend Python/FastAPI.
- Frontend React/Vite/Canvas.
- Tìm kiếm tĩnh một tác nhân.
- BFS, DFS, UCS, Greedy và A*.
- Map demo: `tiny`, `small`.
- Hai bài toán: `eat_all`, `path_to_farthest`.

## 2. Mô hình bài toán

### 2.1 GameState

`GameState` là immutable dataclass:

| Thành phần | Kiểu |
|---|---|
| `pacman` | `(row, col)` |
| `food` | `frozenset[(row, col)]` |
| `power_pellets` | `frozenset[(row, col)]` |
| `ghosts` | tuple vị trí ghost, chỉ là dữ liệu map |
| `score` | số nguyên, không tham gia search key |
| `status` | `playing` hoặc `win` |
| `walls`, `width`, `height` | cấu trúc map bất biến, không tham gia hash/equality |

### 2.2 EatAllFoodProblem

- Initial state: state được parse từ map.
- State key: `(pacman, food)`.
- Actions: UP, DOWN, LEFT, RIGHT nếu không đâm tường.
- Transition: di chuyển Pac-man và xóa food/pellet ở ô mới.
- Goal: `food` rỗng.
- Step cost: 1.

Không được loại trùng chỉ theo vị trí Pac-man: cùng vị trí nhưng tập food khác nhau là hai state khác nhau.

### 2.3 PathToPointProblem

- Đích: food xa nhất theo khoảng cách Manhattan từ initial state.
- State key: vị trí Pac-man.
- Goal: Pac-man ở ô đích.
- Step cost: 1.

## 3. Thuật toán

| Thuật toán | Complete | Optimal | Vai trò |
|---|---|---|---|
| BFS | Có | Có với cost đều | Baseline đường ngắn nhất |
| DFS | Không đảm bảo | Không | Minh họa duyệt sâu |
| UCS | Có | Có | Baseline theo path cost |
| Greedy | Không đảm bảo | Không | Ưu tiên h(n) |
| A* | Có | Có với h admissible | Kết hợp g(n) + h(n) |

Heuristic registry: `null`, `manhattan`, `nearest_food`, `farthest_food`, `food_count`.

## 4. Metrics và cây tìm kiếm

`SearchMetrics` gồm:

- nodes expanded/generated
- max frontier
- time
- path length
- cost
- search depth
- found

Cây tìm kiếm ghi `id`, `parent`, `pos`, `action`, `food_left`, `food`, `power_pellets`, `g`, `h`, `f`, `created_order`, `expanded_order`. Recorder giới hạn 250 node cho payload/UI; search không dừng khi recorder đầy.

## 5. Kiến trúc

### Backend

- `game/layout.py`: parse map và chỉ expose `tiny`, `small` cho demo.
- `game/state.py`: immutable `GameState`.
- `game/problem.py`: hai `SearchProblem` tĩnh.
- `search/uninformed.py`: BFS, DFS, UCS.
- `search/informed.py`: Greedy, A*.
- `search/heuristics.py`: heuristic registry.
- `metrics/counters.py`: metrics thuật toán.
- `api/main.py`: `/algorithms`, `/maps`, `/maps/{name}`, `/solve`, `/compare`.

### Frontend

- `App.jsx`: orchestration và hai tab Run/Compare.
- `useRunner.js`: solve, animate, step forward/back, compare, reset.
- `PacmanRenderer.js`: Canvas maze/path animation.
- `SearchTreePanel.jsx`: cây OPEN/CURRENT/CLOSED và g/h/f.
- `CompareTable`, `CompareCharts`, `FghChart`: so sánh nhiều thuật toán.

Chỉ duy trì frontend React trong `frontend/`.

## 6. API contract

### `/solve`

Nhận `map`, `algorithm`, `heuristic`, `problem`. Trả map đã serialize, solution path/actions, visited order, tree và stats. Dữ liệu này phục vụ animation màn Run.

### `/compare`

Nhận cùng cấu hình và danh sách algorithms. Trả:

```text
{
  problem,
  results: [{
    algorithm,
    found,
    optimal,
    tree,
    tree_truncated,
    tree_limit,
    stats
  }]
}
```

Response không chứa top-level map; row không chứa path hoặc visited order.

## 7. UI

### Run

- Cấu hình map/problem/algorithm/heuristic.
- Automatic hoặc Step-by-step.
- Back/Next bị disable đúng biên.
- Canvas, search tree và algorithm metrics.

### Compare

- Bảng: Algorithm, Time, Cost, Optimal.
- Cây tìm kiếm từng thuật toán.
- Biểu đồ expanded nodes và time.
- Biểu đồ F/G/H nhiều thuật toán, chọn một metric mỗi lần.

## 8. Benchmark

`experiments/run_benchmark.py` chạy 5 thuật toán trên `tiny` và `small`, cho cả `eat_all` và `path_to_farthest`. CSV gồm:

```text
map,problem,algorithm,heuristic,found,path_length,cost,
nodes_expanded,nodes_generated,max_frontier,time_ms
```

## 9. Verification

```powershell
py -3.12 -m pytest -q
py -3.12 experiments/run_benchmark.py
cd frontend
npm test
npm run lint
npm run build
```

Điều kiện hoàn tất:

- API chỉ expose map `tiny`, `small`.
- BFS/UCS/A* nhất quán trên bài có lời giải tối ưu.
- `/compare` đúng contract mới.
- Metrics không chứa trường suy diễn ngoài metrics thuật toán.
- Diagram và tài liệu khớp code chạy thật.
