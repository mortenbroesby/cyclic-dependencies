import { jest } from "@jest/globals"
import initFixture from "../testutils/readFixture"
import findWorkspacePackages from "./findWorkspacePackages"
import buildPackageGraph from "./buildPackageGraph"
import findCycles from "./findCycles"
import printCycles from "./printCycles"

describe("printCycles", () => {
  it("[non-verbose]: given a cycle, prints cyclic dependencies as expected", async () => {
    initFixture("cycle")

    const workspaces = await findWorkspacePackages()
    const graph = await buildPackageGraph(workspaces)
    const cycles = findCycles(graph)

    const log = jest.spyOn(console, "log").mockImplementation(() => {})

    await printCycles(cycles, { logVerbose: false })

    expect(log).toHaveBeenCalledWith("\nCyclic dependencies found in workspace: ", [
      "example1 -> example2 -> example1",
    ])

    log.mockRestore()
  })
})
