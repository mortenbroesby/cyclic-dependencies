#!/usr/bin/env node

import findWorkspaceCycles from "../src/findWorkspaceCycles.js"
import formatCycles from "../src/formatCycles.js"

async function run() {
  const args = process.argv.slice(2)

  try {
    const cycles = await findWorkspaceCycles()
    const { message, results } = await formatCycles(cycles)

    console.log(`\n${message}\n`)

    if (results.length > 0) {
      results.forEach((result) => {
        console.log(`[ ${result.initialModule} ]\n`)
        console.log(`Modules: \n${result.cycle}\n`)
        console.log(`Files: \n${result.files}\n`)
        console.log("--------------------------------------------------\n")
      })

      if (args.includes("--reject")) {
        process.exit(1)
      }
    }
  } catch (error) {
    console.error("ERROR: ", error.message)
  }
}

run()
