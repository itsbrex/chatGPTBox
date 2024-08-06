import { AlwaysCustomGroups, ModelGroups, ModelMode, Models } from '../config/index.mjs'

export function modelNameToDesc(modelName, t) {
  if (!t) t = (x) => x
  if (modelName in Models) return t(Models[modelName].desc)

  let desc = modelName
  if (isCustomModelName(modelName)) {
    const presetPart = modelNameToPresetPart(modelName)
    const customPart = modelNameToCustomPart(modelName)
    if (presetPart in Models) {
      if (customPart in ModelMode)
        desc = `${t(Models[presetPart].desc)} (${t(ModelMode[customPart])})`
      else desc = `${t(Models[presetPart].desc)} (${customPart})`
    } else if (presetPart in ModelGroups) {
      desc = `${t(ModelGroups[presetPart].desc)} (${customPart})`
    }
  }
  return desc
}

export function modelNameToPresetPart(modelName) {
  if (isCustomModelName(modelName)) {
    return modelName.split('-')[0]
  } else {
    return modelName
  }
}

export function modelNameToCustomPart(modelName) {
  if (isCustomModelName(modelName)) {
    return modelName.substring(modelName.indexOf('-') + 1)
  } else {
    return modelName
  }
}

export function modelNameToValue(modelName) {
  if (modelName in Models) return Models[modelName].value

  return modelNameToCustomPart(modelName)
}

export function isCustomModelName(modelName) {
  return modelName ? modelName.includes('-') : false
}

export function modelNameToApiMode(modelName) {
  const presetPart = modelNameToPresetPart(modelName)
  const found =
    Object.entries(ModelGroups).find(([k]) => presetPart === k) ||
    Object.entries(ModelGroups).find(([, g]) => g.value.includes(presetPart))
  if (found) {
    const [groupName] = found
    const isCustom = isCustomModelName(modelName)
    let customName = ''
    if (isCustom) customName = modelNameToCustomPart(modelName)
    return {
      groupName,
      itemName: presetPart,
      isCustom,
      customName,
      customUrl: '',
      apiKey: '',
      active: true,
    }
  }
}

export function apiModeToModelName(apiMode) {
  if (AlwaysCustomGroups.includes(apiMode.groupName))
    return apiMode.groupName + '-' + apiMode.customName

  if (apiMode.isCustom) {
    if (apiMode.itemName === 'custom') return apiMode.groupName + '-' + apiMode.customName
    return apiMode.itemName + '-' + apiMode.customName
  }

  return apiMode.itemName
}

export function getApiModesFromConfig(config, onlyActive) {
  const stringApiModes = config.customApiModes
    .map((apiMode) => {
      if (onlyActive) {
        if (apiMode.active) return apiModeToModelName(apiMode)
      } else return apiModeToModelName(apiMode)
      return false
    })
    .filter((apiMode) => apiMode)
  const originalApiModes = config.activeApiModes
    .map((modelName) => {
      // 'customModel' is always active
      if (stringApiModes.includes(modelName) || modelName === 'customModel') {
        return
      }
      if (modelName === 'azureOpenAi') modelName += '-' + config.azureDeploymentName
      if (modelName === 'ollama') modelName += '-' + config.ollamaModelName
      return modelNameToApiMode(modelName)
    })
    .filter((apiMode) => apiMode)
  return [...originalApiModes, ...config.customApiModes]
}

export function getApiModesStringArrayFromConfig(config, onlyActive) {
  return getApiModesFromConfig(config, onlyActive).map(apiModeToModelName)
}

export function isApiModeSelected(apiMode, configOrSession) {
  return (
    configOrSession.apiMode && JSON.stringify(configOrSession.apiMode) === JSON.stringify(apiMode)
  )
}