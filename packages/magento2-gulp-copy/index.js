import { src } from 'gulp'
import multiDest from 'gulp-multi-dest'
import path from 'path'
import log from 'fancy-log'
import colors from 'ansi-colors'

import { projectPath } from '@mamis/magento2-gulp/helpers/paths'
import { themes, themeNames } from '@mamis/magento2-gulp/helpers/themes'

export const copy = (callback) => {
    const themesConfig = themes()

    themeNames().forEach(
        theme => {
            const themeConfig = themesConfig[theme]

            if (!themeConfig.copy) {
                return
            }

            if (!themeConfig.locale) {
                return callback(
                    Error(`Unable to determine available locales for "${theme}"`)
                )
            }

            const localeDestinations = themeConfig.locale.map(
                (locale) => {
                    return path.join(themeConfig.destination, locale)
                }
            )

            themeConfig.copy.forEach(
                (copy) => {
                    const destinations = localeDestinations.map(
                        (localeDestination) => {
                            return path.join(localeDestination, copy.destination)
                        }
                    )

                    src(
                        path.join(projectPath, themeConfig.source, copy.source)
                    )
                    .pipe(
                        multiDest(destinations)
                    )
                    .on(
                        'finish',
                        () => {
                            log(
                                colors.green(`Copied assets for theme "${theme}"`)
                            )
                        }
                    );
                }
            )
        }
    )

    return callback()
}
