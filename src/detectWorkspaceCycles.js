import { globby } from "globby"
import fs from "fs/promises"
import path from "path"
import yaml from "js-yaml"
import { execSync } from "child_process"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { Table } from "console-table-printer"

import { red, yellow } from "./consoleColors.js"
import { printCycleResponse } from "./printCycles.js"

/**
 * DFS with node coloring
 * white: unvisited
 * gray: currently visiting this node and its children
 * black: already visited this node and all children
 * if we investigate edge to gray node, it is a back edge -> cycle
 */

/**
 * Visit a node and its dependencies to find cycles.
 */
function visit({ nodeName, graph, path = [], paths = [], colors, cycles }) {
  colors[nodeName] = "gray"

  const dependencies = graph[nodeName].dependencies

  for (const { name: dependencyName, path: dependencyPath } of dependencies) {
    const dependencyColor = colors[dependencyName]

    if (dependencyColor === "white") {
      // Recursively visit unvisited (white) nodes
      visit({
        nodeName: dependencyName,
        graph,
        path: [...path, nodeName],
        paths: [...paths, graph[nodeName].path],
        colors,
        cycles,
      })
    } else if (dependencyColor === "gray") {
      // Found a cycle (back edge)
      const cycleStartIndex = path.indexOf(dependencyName)

      cycles.push({
        cycle: [...path.slice(cycleStartIndex), nodeName, dependencyName],
        files: [...paths.slice(cycleStartIndex), graph[nodeName].path, dependencyPath],
      })
    }
  }

  colors[nodeName] = "black"
}

/**
 * Find cycles in a graph of package dependencies.
 */
function findCycles(graph) {
  const nodes = Object.keys(graph).sort()

  // Initialize all nodes as unvisited
  const colors = nodes.reduce((acc, current) => ({ ...acc, [current]: "white" }), {})

  // Store cycles found in the graph
  const cycles = []

  // Visit all nodes in the graph
  while (nodes.some((node) => colors[node] === "white")) {
    const nodeName = nodes.find((node) => colors[node] === "white")
    visit({ nodeName, graph, colors, cycles })
  }

  return cycles
}

/**
 * Reads and parses a JSON file.
 *
 * @param {string} packagePath - Path to the package.json file.
 * @returns {Promise<Object>} Parsed JSON contents of the file.
 */
async function readPackageFile(packagePath) {
  const file = await fs.readFile(packagePath)
  return JSON.parse(file.toString())
}

/**
 * Builds a map of package names to their paths and contents.
 *
 * @param {Array<string>} workspacePackages - List of paths to package.json files.
 * @returns {Promise<Map<string, Object>>} Map of package names to their data.
 */
async function buildPackageMap(workspacePackages) {
  const packageMap = new Map()

  await Promise.all(
    workspacePackages.map(async (packagePath) => {
      const contents = await readPackageFile(packagePath)
      packageMap.set(contents.name, { path: packagePath, contents })
    })
  )

  return packageMap
}

/**
 * Extracts dependencies that are part of the workspace.
 *
 * @param {Object} contents - The parsed contents of a package.json file.
 * @param {Map<string, Object>} packageMap - Map of package names to their data.
 * @returns {Array<Object>} List of dependencies with their names and paths.
 */
function extractWorkspaceDependencies(contents, packageMap) {
  const extractDeps = (deps) =>
    Object.keys(deps || {})
      .filter((dependency) => packageMap.has(dependency))
      .map((dependency) => ({
        name: dependency,
        path: packageMap.get(dependency).path,
      }))

  const dependencies = extractDeps(contents.dependencies)
  const devDependencies = extractDeps(contents.devDependencies)

  return dependencies.concat(devDependencies)
}

/**
 * Builds an adjacency list representing the workspace package graph.
 *
 * @param {Array<string>} workspacePackages - List of paths to package.json files.
 * @returns {Promise<Object>} Adjacency list of workspace packages.
 */
async function buildPackageGraph(workspacePackages) {
  const packageMap = await buildPackageMap(workspacePackages)

  return Array.from(packageMap.entries()).reduce((accumulator, [name, { path, contents }]) => {
    return {
      ...accumulator,
      [name]: {
        path,
        dependencies: extractWorkspaceDependencies(contents, packageMap),
      },
    }
  }, {})
}

async function determineWorkspaces() {
  const rootPackage = await fs.readFile("./package.json", "utf8")

  const { workspaces } = JSON.parse(rootPackage)
  if (!workspaces) {
    try {
      const pnpmWorkspaceFile = await fs.readFile("./pnpm-workspace.yaml", "utf8")
      const pnpmWorkspaceDefinition = yaml.load(pnpmWorkspaceFile)
      return pnpmWorkspaceDefinition.packages
    } catch (error) {
      throw new Error("Missing workspace definition")
    }
  }

  return workspaces
}

async function findWorkspacePackages() {
  try {
    await fs.access("./package.json")
  } catch (error) {
    throw new Error("Missing package.json in working directory")
  }

  const workspaces = await determineWorkspaces()

  const workspacePackages = await globby(
    workspaces.map((x) => path.join(x, "package.json")),
    { gitignore: true }
  )

  return workspacePackages
}

async function findWorkspaceCycles() {
  const workspaces = await findWorkspacePackages()
  const graph = await buildPackageGraph(workspaces)
  const cycles = findCycles(graph)
  return cycles
}

////////////////////////////////////////
//#region Generate DOT File

async function generateDotFile(cycles) {
  let dot = "digraph G {\n"

  cycles.forEach((cycleInfo, index) => {
    dot += `  subgraph cluster_${index} {\n    label="Cycle ${index + 1}";\n`
    cycleInfo.cycle.forEach((node, idx) => {
      if (idx < cycleInfo.cycle.length - 1) {
        dot += `    "${node}" -> "${cycleInfo.cycle[idx + 1]}";\n`
      }
    })
    dot += "  }\n"
  })

  dot += "}\n"

  await fs.writeFile("cycles.dot", dot)
  console.log("DOT file generated: cycles.dot")

  try {
    execSync("dot -Tpng cycles.dot -o cycles.png")
    console.log("Cycle visualization generated: cycles.png")
  } catch (error) {
    console.error("Failed to generate visualization:", error.message)
  }
}

//#endregion Generate DOT File
////////////////////////////////////////

////////////////////////////////////////
//#region Visualize Cycles

function findCycleStart(cycle) {
  const firstOccurrence = {}
  let cycleStart = null

  for (let i = 0; i < cycle.length; i++) {
    const node = cycle[i]
    if (firstOccurrence[node] !== undefined) {
      cycleStart = node
      break
    }
    firstOccurrence[node] = i
  }

  return cycleStart
}

function findCriticalDependencies(files) {
  const dependencies = []
  files.forEach((file, index) => {
    dependencies.push(`${file} imports ${files[index + 1]}`)
  })
  return dependencies
}

function groupUniqueCyclesByStart(cycles) {
  const cycleGroups = {}

  cycles.forEach((cycle) => {
    const cycleStart = findCycleStart(cycle.cycle)
    if (!cycleGroups[cycleStart]) {
      cycleGroups[cycleStart] = []
    }
    cycleGroups[cycleStart].push(cycle)
  })

  return cycleGroups
}

function findShortestCycle(cycles) {
  return cycles.reduce((shortest, current) => {
    return current.cycle.length < shortest.cycle.length ? current : shortest
  }, cycles[0])
}

function generateCycleReport(cycles, options) {
  // Print the whole picture
  if (options.verbose) {
    console.log("Full Cycle Report:")
    console.log(`${red(`>> ${Object.keys(cycles).length} cycles found in workspace.`)}`)
    cycles.forEach((cycle) => {
      const cycleStart = findCycleStart(cycle.cycle)
      const criticalDependencies = findCriticalDependencies(cycle.files)

      console.log("---------------------------")
      console.log(`Cycle Group: ${cycleStart}`)
      console.log(`Cycle starts at: ${cycleStart}`)
      console.log("Files involved:")
      cycle.files.forEach((file) => console.log(`  - ${file}`))
      console.log("Critical dependencies causing the cycle:")
      criticalDependencies.forEach((dependency) => console.log(`  - ${dependency}`))
      console.log("Cycle details:")
      console.log(`  ${cycle.cycle.join(" -> ")}`)
    })
    console.log("---------------------------")
  }

  // Group cycles by their start package
  const cycleGroups = groupUniqueCyclesByStart(cycles)

  // Print the shortest unique non-overlapping cycles
  console.log(`${red(`>> ${Object.keys(cycleGroups).length} unique cycles found in workspace.`)}`)
  Object.keys(cycleGroups).forEach((cycleStart, cycleIndex) => {
    const shortestCycle = findShortestCycle(cycleGroups[cycleStart])
    const criticalDependencies = findCriticalDependencies(shortestCycle.files)

    console.log("---------------------------")
    console.log(`${red(`[Cycle ${cycleIndex + 1}]: ${`${yellow(cycleStart)}`}`)}`)
    console.log("Package Graph:")
    console.log(`  ${shortestCycle.cycle.join(" -> ")}`)
    console.log("Files involved:")
    shortestCycle.files.forEach((file) => console.log(`  - ${file}`))
    console.log("Critical dependencies causing the cycle:")
    criticalDependencies.forEach((dependency) => console.log(`  - ${dependency}`))
  })
  console.log("---------------------------")

  // Print using table
  console.log(`${red(`>> ${Object.keys(cycleGroups).length} unique cycles found in workspace.`)}`)
  Object.keys(cycleGroups).forEach((cycleStart, cycleIndex) => {
    const cycle = findShortestCycle(cycleGroups[cycleStart])
    const criticalDependencies = findCriticalDependencies(cycle.files)

    console.log("\n")

    const table = new Table({
      title: `Cycle: ${cycleStart}`,
      columns: [
        { name: "Modules", alignment: "left" },
        { name: "Files", alignment: "left" },
      ],
    })

    table.addRows(
      cycle.cycle.map((modules, index) => ({
        Modules: `${modules}${index < cycle.cycle.length - 1 ? " ↓" : ""}`,
        Files: `${cycle.files[index]}${index < cycle.files.length - 1 ? " ↓" : ""}`,
      }))
    )

    table.printTable()
  })
}

//#endregion Visualize Cycles
////////////////////////////////////////

export default async function visualizeCycles() {
  const options = yargs(hideBin(process.argv))
    .option("image", {
      alias: "i",
      type: "boolean",
      description: "Generate a DOT file and image for the cycles",
    })
    .option("text", {
      alias: "t",
      type: "boolean",
      description: "Print a text-based representation of the cycles",
    })
    .option("report", {
      alias: "r",
      type: "boolean",
      description: "Print a detailed report of the cycles",
    })
    .option("verbose", {
      alias: "v",
      type: "boolean",
      description: "Print verbose output",
    })
    .help()
    .alias("help", "h").argv

  const cycles = await findWorkspaceCycles()

  if (cycles.length === 0) {
    console.log("No cycles found.")
    return
  }

  if (options.image) {
    return await generateDotFile(cycles)
  }

  if (options.text) {
    return printCycleResponse(cycles)
  }

  if (options.report) {
    return generateCycleReport(cycles, options)
  }
}
