import initFixture from "./testutils/readFixture"
import findWorkspacePackages from "./src/findWorkspacePackages"
import buildPackageGraph from "./src/buildPackageGraph"
import findCycles from "./src/findCycles"

describe("findWorkspacePackages", () => {
  it("finds workspace packages when explicitly declared", async () => {
    initFixture("default")
    const workspaces = await findWorkspacePackages()

    expect(workspaces).toStrictEqual(["example1/package.json", "example2/package.json"])
  })

  it("finds workspace packages declared with *", async () => {
    initFixture("star")
    const workspaces = await findWorkspacePackages()

    expect(workspaces).toStrictEqual([
      "packages/example1/package.json",
      "packages/example2/package.json",
    ])
  })

  it("finds workspace packages declared with **", async () => {
    initFixture("doublestar")
    const workspaces = await findWorkspacePackages()

    expect(workspaces.sort()).toStrictEqual(
      [
        "packages/backend/one/package.json",
        "packages/backend/two/package.json",
        "packages/frontend/one/package.json",
        "packages/frontend/two/package.json",
      ].sort()
    )
  })

  it("excludes node_modules", async () => {
    initFixture("exclude-node-modules")
    const workspaces = await findWorkspacePackages()

    expect(workspaces.sort()).toStrictEqual(
      [
        "packages/backend/one/package.json",
        "packages/backend/two/package.json",
        "packages/frontend/one/package.json",
        "packages/frontend/two/package.json",
      ].sort()
    )
  })

  it("throws error if workspace definition is missing", async () => {
    initFixture("missing-workspace")
    await expect(findWorkspacePackages()).rejects.toEqual(Error("Missing workspace definition"))
  })

  it("throws error if no package", async () => {
    initFixture("missing-root-package")
    await expect(findWorkspacePackages()).rejects.toEqual(
      Error("Missing package.json in working directory")
    )
  })
})

describe("buildPackageGraph", () => {
  it("returns adjacency list of workspace packages", async () => {
    initFixture("default")
    const workspaces = await findWorkspacePackages()
    const graph = await buildPackageGraph(workspaces)

    expect(graph).toStrictEqual({
      example1: {
        path: "example1/package.json",
        dependencies: [
          {
            name: "example2",
            path: "example2/package.json",
          },
        ],
      },
      example2: {
        path: "example2/package.json",
        dependencies: [],
      },
    })
  })
})

describe("findCycles", () => {
  it("returns none if no cycle", async () => {
    initFixture("default")
    const workspaces = await findWorkspacePackages()
    const graph = await buildPackageGraph(workspaces)
    const cycles = findCycles(graph)

    expect(cycles).toStrictEqual([])
  })

  it("finds a direct cycle", async () => {
    initFixture("cycle")
    const workspaces = await findWorkspacePackages()
    const graph = await buildPackageGraph(workspaces)
    const cycles = findCycles(graph)

    expect(cycles).toStrictEqual([
      {
        cycle: ["example1", "example2", "example1"],
        dependencyPaths: [
          "example1/package.json",
          "example2/package.json",
          "example1/package.json",
        ],
      },
    ])
  })

  it("finds larger cycle", async () => {
    initFixture("cycle-larger")
    const workspaces = await findWorkspacePackages()
    const graph = await buildPackageGraph(workspaces)
    const cycles = findCycles(graph)

    expect(cycles[0].cycle).toStrictEqual([
      "eight",
      "nine",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
    ])
  })

  it("finds small cycle in larger project", async () => {
    initFixture("cycle-subset")
    const workspaces = await findWorkspacePackages()
    const graph = await buildPackageGraph(workspaces)
    const cycles = findCycles(graph)

    expect(cycles).toStrictEqual([
      {
        cycle: ["d", "e", "f", "d"],
        dependencyPaths: [
          "packages/d/package.json",
          "packages/e/package.json",
          "packages/f/package.json",
          "packages/d/package.json",
        ],
      },
    ])
  })

  it("finds multiple cycles", async () => {
    initFixture("cycle-multi")
    const workspaces = await findWorkspacePackages()
    const graph = await buildPackageGraph(workspaces)
    const cycles = findCycles(graph)

    expect(cycles).toStrictEqual([
      {
        cycle: ["a", "b", "c", "a"],
        dependencyPaths: [
          "packages/a/package.json",
          "packages/b/package.json",
          "packages/c/package.json",
          "packages/a/package.json",
        ],
      },
      {
        cycle: ["d", "e", "f", "g", "d"],
        dependencyPaths: [
          "packages/d/package.json",
          "packages/e/package.json",
          "packages/f/package.json",
          "packages/g/package.json",
          "packages/d/package.json",
        ],
      },
    ])
  })
})
