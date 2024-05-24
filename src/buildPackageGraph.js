import fs from "fs/promises"

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

export default buildPackageGraph
