export const buildInfo = {
  version: __APP_VERSION__,
  sha: __BUILD_SHA__.slice(0, 12),
}

export const buildLabel = `v${buildInfo.version} (${buildInfo.sha})`
