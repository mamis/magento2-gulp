import mergeStream from 'merge-stream'
import helper from './helpers/sass'
import { themes, themeNames } from '@mamis/magento2-gulp/helpers/themes'

export const sass = () => {
    const streams = mergeStream()

    const themesData = themes()
    const themeNamesData = themeNames()

    themeNamesData.forEach(
        name => {
            const theme = themesData[name]

            if (theme.dsl != 'sass' && theme.dsl != 'scss') {
                return
            }

            streams.add(helper(name))
        }
    )

    return streams
}
