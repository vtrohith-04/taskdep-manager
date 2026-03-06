/**
 * Build adjacency: taskId -> list of task IDs it depends on (predecessors).
 * Edge (pred, task) means "task depends on pred".
 */
export function getPredecessors(tasks) {
  const byId = new Map();
  tasks.forEach((t) => byId.set(String(t._id), t));
  const pred = new Map();
  tasks.forEach((t) => {
    const id = String(t._id);
    const deps = (t.dependsOn || [])
      .map((d) => (typeof d === 'object' ? d._id : d))
      .filter((d) => byId.has(String(d)));
    pred.set(id, deps.map(String));
  });
  return { byId, pred };
}

/**
 * Topological layers: layer 0 = no deps in set, layer 1 = only depend on layer 0, etc.
 * Only assign when all predecessors have a layer (multi-pass).
 */
export function getLayers(tasks, pred) {
  const ids = new Set(tasks.map((t) => String(t._id)));
  const layer = new Map();
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of ids) {
      if (layer.has(id)) continue;
      const deps = pred.get(id) || [];
      const depsInSet = deps.filter((d) => ids.has(d));
      if (depsInSet.length === 0) {
        layer.set(id, 0);
        changed = true;
      } else {
        const depLayers = depsInSet.map((d) => layer.get(d)).filter((l) => l !== undefined);
        if (depLayers.length === depsInSet.length) {
          const maxDepLayer = Math.max(...depLayers);
          layer.set(id, maxDepLayer + 1);
          changed = true;
        }
      }
    }
  }
  ids.forEach((id) => {
    if (!layer.has(id)) layer.set(id, 0);
  });
  return layer;
}

/**
 * Longest path ending at each node (in number of nodes).
 * Critical path = path of maximum length; returns Set of node ids and Set of edges "from->to".
 */
export function getCriticalPath(tasks, pred) {
  const ids = new Set(tasks.map((t) => String(t._id)));
  const succ = new Map();
  ids.forEach((id) => succ.set(id, []));
  tasks.forEach((t) => {
    const id = String(t._id);
    (pred.get(id) || []).filter((p) => ids.has(p)).forEach((p) => {
      succ.get(p).push(id);
    });
  });
  const indegree = new Map();
  ids.forEach((id) => indegree.set(id, (pred.get(id) || []).filter((p) => ids.has(p)).length));
  const topo = [];
  const queue = [...ids].filter((id) => indegree.get(id) === 0);
  while (queue.length) {
    const u = queue.shift();
    topo.push(u);
    (succ.get(u) || []).forEach((v) => {
      indegree.set(v, indegree.get(v) - 1);
      if (indegree.get(v) === 0) queue.push(v);
    });
  }
  ids.forEach((id) => {
    if (!topo.includes(id)) topo.push(id);
  });

  const dist = new Map();
  const parent = new Map();
  topo.forEach((id) => {
    const deps = (pred.get(id) || []).filter((d) => ids.has(d));
    if (deps.length === 0) {
      dist.set(id, 1);
      parent.set(id, null);
    } else {
      let best = 0;
      let bestPred = null;
      deps.forEach((p) => {
        const d = (dist.get(p) || 0) + 1;
        if (d > best) {
          best = d;
          bestPred = p;
        }
      });
      dist.set(id, best);
      parent.set(id, bestPred);
    }
  });

  let maxDist = 0;
  let endNode = null;
  dist.forEach((d, id) => {
    if (d > maxDist) {
      maxDist = d;
      endNode = id;
    }
  });

  const pathIds = new Set();
  const pathEdges = new Set();
  if (endNode) {
    let cur = endNode;
    while (cur) {
      pathIds.add(cur);
      const p = parent.get(cur);
      if (p) pathEdges.add(`${p}->${cur}`);
      cur = p;
    }
  }
  return { pathIds, pathEdges };
}
