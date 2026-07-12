from collections import defaultdict

from backend.game.layout import load_layout
from backend.game.problem import EatAllFoodProblem, PathToPointProblem, farthest_food
from backend.search.heuristics import get_heuristic
from backend.search.registry import SEARCH_ALGOS, is_informed


def run_static(problem, algo):
    fn = SEARCH_ALGOS[algo]
    if is_informed(algo):
        return fn(problem, get_heuristic("manhattan"), record_tree=True)
    return fn(problem, record_tree=True)


def test_path_to_farthest_does_not_expand_same_cell_twice():
    start = load_layout("small")
    problem = PathToPointProblem(start, farthest_food(start))

    for algo in SEARCH_ALGOS:
        result = run_static(problem, algo)
        expanded = [tuple(pos) for pos in result.visited_order]
        assert len(expanded) == len(set(expanded)), algo


def expanded_state_keys(result):
    return [
        (tuple(node["pos"]), frozenset(map(tuple, node["food"])))
        for node in result.tree
        if node["expanded_order"] is not None
    ]


def test_eat_all_does_not_expand_same_complete_state_twice():
    start = load_layout("tiny")

    for algo in SEARCH_ALGOS:
        keys = expanded_state_keys(run_static(EatAllFoodProblem(start), algo))
        assert len(keys) == len(set(keys)), algo


def test_eat_all_keeps_same_position_with_different_food_sets():
    result = SEARCH_ALGOS["bfs"](EatAllFoodProblem(load_layout("tiny")), record_tree=True)
    food_sets_by_position_and_count = defaultdict(set)

    for position, food in expanded_state_keys(result):
        food_sets_by_position_and_count[(position, len(food))].add(food)

    assert any(len(food_sets) > 1 for food_sets in food_sets_by_position_and_count.values())
