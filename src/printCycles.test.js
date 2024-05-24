import { jest } from "@jest/globals"
import initFixture from "../testutils/readFixture"
import findWorkspacePackages from "./findWorkspacePackages"
import buildPackageGraph from "./buildPackageGraph"
import findCycles from "./findCycles"
import printCycles from "./printCycles"

describe("printCycles", () => {
  it("given a cycle, prints cyclic dependencies", async () => {
    initFixture("cycle")

    const workspaces = await findWorkspacePackages()
    const graph = await buildPackageGraph(workspaces)
    const cycles = findCycles(graph)

    const log = jest.spyOn(console, "log").mockImplementation(() => {})

    await printCycles(cycles, { logVerbose: false })

    expect(log).toHaveBeenCalledWith("\nCyclic dependencies found in workspace\n")
    expect(log).toHaveBeenCalledWith("example1 -> \nexample2 -> \nexample1\n")

    log.mockRestore()
  })

  it("given a cycle, returns extended response in verbose mode", async () => {
    initFixture("cycle")

    const workspaces = await findWorkspacePackages()
    const graph = await buildPackageGraph(workspaces)
    const cycles = findCycles(graph)

    const log = jest.spyOn(console, "log").mockImplementation(() => {})

    await printCycles(cycles, { logVerbose: true })

    expect(log).toHaveBeenCalledWith("\nCyclic dependencies found in workspace\n")
    expect(log).toHaveBeenCalledWith("[ Cycle: example1 ]\n")
    expect(log).toHaveBeenCalledWith("Modules: \nexample1 -> \nexample2 -> \nexample1\n")
    expect(log).toHaveBeenCalledWith(
      "Files: \nexample1/package.json -> \nexample2/package.json -> \nexample1/package.json\n"
    )

    log.mockRestore()
  })
})
