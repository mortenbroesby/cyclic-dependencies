import initFixture from "../testutils/readFixture"
import findWorkspacePackages from "./findWorkspacePackages"
import buildPackageGraph from "./buildPackageGraph"
import findCycles from "./findCycles"
import formatCycles from "./formatCycles"

describe("formatCycles", () => {
  it("given a complex cycle, returns formatted response", async () => {
    initFixture("cycle-multi")

    const workspaces = await findWorkspacePackages()
    const graph = await buildPackageGraph(workspaces)
    const cycles = findCycles(graph)
    const { results } = await formatCycles(cycles)

    expect(results).toStrictEqual([
      {
        initialModule: "a",
        cycle: "a -> \nb -> \nc -> \na",
        files:
          "packages/a/package.json -> \n" +
          "packages/b/package.json -> \n" +
          "packages/c/package.json -> \n" +
          "packages/a/package.json",
      },
      {
        initialModule: "d",
        cycle: "d -> \ne -> \nf -> \ng -> \nd",
        files:
          "packages/d/package.json -> \n" +
          "packages/e/package.json -> \n" +
          "packages/f/package.json -> \n" +
          "packages/g/package.json -> \n" +
          "packages/d/package.json",
      },
    ])
  })
})
