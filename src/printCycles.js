export function printVerboseResponse(cycles) {
  console.log("\nCyclic dependencies found in workspace: \n")
  console.log("--------------------------------------------------\n")
  cycles.forEach(({ cycle, dependencyPaths }) => {
    console.log(`[ Cycle: ${cycle[0]} ]\n`)
    console.log(`Modules: \n${cycle.join(" -> \n")}\n`)
    console.log(`Files: \n${dependencyPaths.join(" -> \n")}\n`)
    console.log("--------------------------------------------------\n")
  })
}

async function printCycles(cycles, options = {}) {
  const { logVerbose = true } = options

  if (cycles.length === 0) {
    console.log("\nNo cyclic dependencies found in workspace\n")
    return
  }

  if (logVerbose) {
    return printVerboseResponse(cycles)
  }

  console.log(
    "\nCyclic dependencies found in workspace: ",
    cycles.map(({ cycle }) => cycle.join(" -> "))
  )
}

export default printCycles
