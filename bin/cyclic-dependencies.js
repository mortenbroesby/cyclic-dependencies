#!/usr/bin/env node

import detectWorkspaceCycles from "../src/detectWorkspaceCycles.js"

async function run() {
  try {
    await detectWorkspaceCycles()
  } catch (error) {
    console.error("ERROR: ", error.message)
  }
}

run()
