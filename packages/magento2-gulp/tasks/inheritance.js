import { themeNames } from '../helpers/themes'
import helper from '../helpers/inheritance'

export const inheritance = async() => {
    await Promise.all(
        themeNames().map(
            themeName => helper(themeName)
        )
    )
}