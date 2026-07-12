export function buildFghSeries(rows, metric, nameOf) {
  return (rows || [])
    .filter((row) => !row.error)
    .map((row) => {
      const nodes = (row.tree || [])
        .filter((node) => node.expanded_order != null)
        .sort((a, b) => a.expanded_order - b.expanded_order);
      return {
        algorithm: row.algorithm,
        name: nameOf(row.algorithm),
        orders: nodes.map((node) => node.expanded_order),
        values: nodes.map((node) => node[metric]),
        truncated: !!row.tree_truncated,
        limit: row.tree_limit || 0,
      };
    })
    .filter((series) => series.values.length > 0);
}
