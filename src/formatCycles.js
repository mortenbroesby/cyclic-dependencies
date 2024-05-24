async function formatCycles(cycles) {
  if (cycles.length === 0) {
    return {
      results: [],
      message: "No cyclic dependencies found in workspace",
    }
  }

  const results = cycles.map(({ cycle, dependencyPaths }) => ({
    initialModule: cycle[0],
    cycle: cycle.join(" -> \n"),
    files: dependencyPaths.join(" -> \n"),
  }))

  return {
    results,
    message: "Cyclic dependencies found in workspace",
  }
}

export default formatCycles
