import { Table } from "console-table-printer"
import { red } from "./consoleColors.js"

export function printCycleResponse(cycles) {
  console.log(`\n${red(`>> ${cycles.length + 1} Cyclic dependencies found in workspace.`)}`)

  cycles.forEach(({ cycle, files }) => {
    console.log("\n")
    new Table({
      title: `Cycle: ${cycle[0]}`,
      columns: [
        { name: "Modules", alignment: "left" },
        { name: "Files", alignment: "left" },
      ],
    })
      .addRows(
        cycle.map((modules, index) => ({
          Modules: `${modules}${index < cycle.length - 1 ? " ↓" : ""}`,
          Files: `${files[index]}${index < cycle.length - 1 ? " ↓" : ""}`,
        }))
      )
      // Ensure most rows have the same horizontal spacing
      .addRow({
        Modules: " ".repeat(40),
        Files: " ".repeat(40),
      })
      .printTable()
  })
}

async function printCycles(cycles, options = {}) {
  const { logVerbose = true } = options

  if (cycles.length === 0) {
    console.log("\nNo cyclic dependencies found in workspace\n")
    return
  }

  if (logVerbose) {
    return printCycleResponse(cycles)
  }

  console.log(
    "\nCyclic dependencies found in workspace: ",
    cycles.map(({ cycle }) => cycle.join(" -> "))
  )
}

export default printCycles
