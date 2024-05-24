#!/usr/bin/env node

import findWorkspaceCycles from "../src/findWorkspaceCycles.js"
import printCycles from "../src/printCycles.js"

async function run() {
  const args = process.argv.slice(2)
  const logVerbose = args.includes("--verbose")
  const rejectOnCycles = args.includes("--reject")

  try {
    const cycles = await findWorkspaceCycles()
    await printCycles(cycles, { logVerbose })

    if (rejectOnCycles && cycles.length > 0) {
      process.exit(1)
    }
  } catch (error) {
    console.error("ERROR: ", error.message)
  }
}

run()
