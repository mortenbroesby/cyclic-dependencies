import { globby } from "globby"
import fs from "fs/promises"
import path from "path"
import yaml from "js-yaml"

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

export default findWorkspacePackages
