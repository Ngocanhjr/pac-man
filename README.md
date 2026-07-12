# Pac-man A.I. — Tìm kiếm tĩnh và phân tích không gian trạng thái

Đồ án Trí tuệ nhân tạo mô hình hóa Pac-man như bài toán tìm kiếm một tác nhân. Hệ thống cài đặt và trực quan hóa 5 thuật toán:

- Tìm kiếm mù: BFS, DFS, UCS.
- Tìm kiếm có thông tin: Greedy Best-First, A*.

Backend FastAPI chứa mô hình bài toán, thuật toán và metrics. Frontend React + Vite hiển thị maze, cây tìm kiếm, chế độ tự động/từng bước và màn so sánh.

## Cài đặt

Máy phát triển dùng Python 3.12:

```powershell
py -3.12 -m pip install -r backend/requirements.txt
cd frontend
npm install
```

## Chạy ứng dụng

Terminal 1:

```powershell
py -3.12 -m uvicorn backend.api.main:app --reload --port 8000
```

Terminal 2:

```powershell
cd frontend
npm run dev
```

Mở <http://localhost:5173>. Swagger ở <http://localhost:8000/docs>.

## Phạm vi hiện tại

- Map hiển thị qua API/UI: `tiny`, `small`.
- Bài toán `eat_all`: ăn hết food.
- Bài toán `path_to_farthest`: đi tới food xa nhất theo Manhattan.
- Chế độ chạy: tự động hoặc từng bước, có quay lại.
- Cây tìm kiếm ghi tối đa 250 node để bảo vệ UI; thuật toán vẫn tiếp tục giải sau giới hạn này.

## Mô hình trạng thái

`GameState` là immutable dataclass gồm vị trí Pac-man, food, power pellets, ghosts, score, status, walls và kích thước map. Tìm kiếm chỉ dùng phần trạng thái liên quan đến từng bài toán:

| Bài toán | State key | Goal test | Path cost |
|---|---|---|---|
| `eat_all` | `(pacman, food)` | `food` rỗng | Mỗi bước = 1 |
| `path_to_farthest` | `pacman` | Pac-man tới ô đích | Mỗi bước = 1 |

Walls và kích thước map là bất biến, không tham gia hash/equality. Ghosts, score và status không ảnh hưởng khóa tìm kiếm tĩnh.

## Thuật toán và heuristic

| Nhóm | Thuật toán | Tối ưu |
|---|---|---|
| Mù | BFS | Có khi mọi bước cùng chi phí |
| Mù | DFS | Không đảm bảo |
| Mù | UCS | Có |
| Có thông tin | Greedy | Không đảm bảo |
| Có thông tin | A* | Có với heuristic admissible |

Heuristic: `null`, `manhattan`, `nearest_food`, `farthest_food`, `food_count`.

## Metrics

`SearchMetrics` trả:

- `nodes_expanded`
- `nodes_generated`
- `max_frontier`
- `time_ms`
- `path_length`
- `cost`
- `search_depth`
- `found`

`max_frontier` là metric thuật toán; hệ thống không quy đổi nó thành dung lượng bộ nhớ.

## API contract

### `POST /solve`

Request:

```json
{
  "map": "small",
  "algorithm": "astar",
  "heuristic": "farthest_food",
  "problem": "eat_all"
}
```

Response gồm `map`, `algorithm`, `heuristic`, `found`, `actions`, `path`, `visited_order`, `tree`, `tree_truncated`, `tree_limit`, `stats`.

### `POST /compare`

Request:

```json
{
  "map": "small",
  "algorithms": ["bfs", "ucs", "astar"],
  "heuristic": "farthest_food",
  "problem": "eat_all"
}
```

Response:

```json
{
  "problem": "eat_all",
  "results": [
    {
      "algorithm": "astar",
      "found": true,
      "optimal": true,
      "tree": [],
      "tree_truncated": false,
      "tree_limit": 250,
      "stats": {}
    }
  ]
}
```

`/compare` không trả top-level `map`; từng row không trả `path` hoặc `visited_order`.

## Kiểm thử và benchmark

```powershell
py -3.12 -m pytest -q
py -3.12 experiments/run_benchmark.py
cd frontend
npm test
npm run lint
npm run build
```

Benchmark ghi `experiments/results.csv` cho 5 thuật toán × 2 bài toán × 2 map.

## Cấu trúc repo

```text
pac-man/
├── backend/
│   ├── api/              # FastAPI routes + schemas
│   ├── game/             # state, layout, rules, problems
│   ├── maps/             # tiny.txt, small.txt (map demo)
│   ├── metrics/          # SearchMetrics
│   └── search/           # BFS, DFS, UCS, Greedy, A*, heuristics
├── frontend/             # React + Vite + Canvas
├── tests/                # rules, layout, search, API
├── experiments/          # benchmark script + results.csv
├── diagrams/             # Archify JSON + HTML
└── docs/                 # đề bài + PLAN.md
```

Frontend duy nhất là `frontend/`.

