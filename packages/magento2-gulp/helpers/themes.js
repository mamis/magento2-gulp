import { theme } from './options'
import errorMessage from './error-message'
import config from './config'

export default () => {
    return module.exports.themes()
}

export const themeNames = () => {
    const themes = module.exports.themes()

    const themesNames = Object.keys(themes)

    // If a specific theme was selected, ensure it's available in the theme.json configuration
    if (theme && themesNames.indexOf(theme) === -1) {
        throw new Error(errorMessage(theme + ' theme is not defined in themes.json'))
    }

    return theme ? [theme] : themesNames
}

export const themes = () => {
    return config('themes.json')
}