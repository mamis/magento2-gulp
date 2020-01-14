import mergeStream from 'merge-stream'
import helper from './helpers/less'
import { themes, themeNames } from '@mamis/magento2-gulp/helpers/themes'

export const less = () => {
    const streams = mergeStream()

    const themesData = themes()
    const themeNamesData = themeNames()

    themeNamesData.forEach(
        name => {
            const theme = themesData[name]

            if (theme.dsl != 'less') {
                return
            }

            streams.add(helper(name))
        }
    )

    return streams
}
