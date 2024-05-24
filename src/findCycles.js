/**
 * DFS with node coloring
 * white: unvisited
 * gray: currently visiting this node and its children
 * black: already visited this node and all children
 * if we investigate edge to gray node, it is a back edge -> cycle
 */

function findCycles(graph) {
  const nodes = Object.keys(graph).sort()
  const colors = nodes.reduce((acc, current) => ({ ...acc, [current]: "white" }), {})
  let cycles = []

  function visit(name, path = [], paths = []) {
    colors[name] = "gray"
    const dependencies = graph[name].dependencies
    for (const { name: neighbour, path: dependencyPath } of dependencies) {
      const color = colors[neighbour]
      if (color === "white") {
        visit(neighbour, [...path, name], [...paths, graph[name].path])
      } else if (color === "gray") {
        const index = path.indexOf(neighbour)
        cycles.push({
          cycle: [...path.slice(index), name, neighbour],
          dependencyPaths: [...paths.slice(index), graph[name].path, dependencyPath],
        })
      }
    }
    colors[name] = "black"
  }

  while (nodes.some((x) => colors[x] === "white")) {
    const whiteNode = nodes.find((x) => colors[x] === "white")
    visit(whiteNode)
  }

  return cycles
}

export default findCycles
