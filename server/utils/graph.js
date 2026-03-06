/**
 * Circular dependency detection using Depth-First Search (DFS).
 *
 * Given a list of all tasks (with their dependsOn arrays),
 * checks if adding `newDeps` to `taskId` would create a cycle.
 *
 * Strategy: After applying the proposed change, do a DFS from
 * `taskId` following dependency edges. If we can reach `taskId`
 * again, a cycle exists.
 */
function hasCircularDependency(tasks, taskId, newDeps) {
    // Build adjacency map: taskId -> [dependsOn ids]
    const adjMap = {};
    for (const task of tasks) {
        const id = task._id.toString();
        adjMap[id] = (task.dependsOn || []).map((d) => d.toString());
    }

    // Apply proposed new dependencies for the target task
    adjMap[taskId.toString()] = newDeps.map((d) => d.toString());

    // DFS to detect if we can reach taskId starting from any of newDeps
    const target = taskId.toString();

    function dfs(current, visited) {
        if (current === target) return true;
        if (visited.has(current)) return false;
        visited.add(current);

        const neighbors = adjMap[current] || [];
        for (const neighbor of neighbors) {
            if (dfs(neighbor, visited)) return true;
        }
        return false;
    }

    for (const dep of newDeps) {
        const depStr = dep.toString();
        if (depStr === target) return true; // Self-dependency
        if (dfs(depStr, new Set())) return true;
    }

    return false;
}

module.exports = { hasCircularDependency };
