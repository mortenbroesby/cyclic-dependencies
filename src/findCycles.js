/**
 * DFS with node coloring
 * white: unvisited
 * gray: currently visiting this node and its children
 * black: already visited this node and all children
 * if we investigate edge to gray node, it is a back edge -> cycle
 */

/**
 * Visit a node and its dependencies to find cycles.
 */
function visit({ nodeName, graph, path = [], paths = [], colors, cycles }) {
  colors[nodeName] = "gray"

  const dependencies = graph[nodeName].dependencies

  for (const { name: dependencyName, path: dependencyPath } of dependencies) {
    const dependencyColor = colors[dependencyName]

    if (dependencyColor === "white") {
      // Recursively visit uncolors (white) nodes
      visit({
        nodeName: dependencyName,
        graph,
        path: [...path, nodeName],
        paths: [...paths, graph[nodeName].path],
        colors,
        cycles,
      })
    } else if (dependencyColor === "gray") {
      // Found a cycle (back edge)
      const cycleStartIndex = path.indexOf(dependencyName)

      cycles.push({
        cycle: [...path.slice(cycleStartIndex), nodeName, dependencyName],
        files: [...paths.slice(cycleStartIndex), graph[nodeName].path, dependencyPath],
      })
    }
  }

  colors[nodeName] = "black"
}

/**
 * Find cycles in a graph of package dependencies.
 */
function findCycles(graph) {
  const nodes = Object.keys(graph).sort()

  // Initialize all nodes as uncolors
  const colors = nodes.reduce((acc, current) => ({ ...acc, [current]: "white" }), {})

  // Store cycles found in the graph
  const cycles = []

  // Visit all nodes in the graph
  while (nodes.some((node) => colors[node] === "white")) {
    const nodeName = nodes.find((node) => colors[node] === "white")
    visit({ nodeName, graph, colors, cycles })
  }

  return cycles
}

export default findCycles
