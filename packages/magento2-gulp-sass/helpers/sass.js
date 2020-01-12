import { src } from 'gulp'
import path from 'path'
import sass from 'gulp-sass'
import rename from 'gulp-rename'
import multiDest from 'gulp-multi-dest'
import logger from 'gulp-logger'
import postcss from 'gulp-postcss'

import config from '@mamis/magento2-gulp/helpers/config'
import { themes } from '@mamis/magento2-gulp/helpers/themes'
import { projectPath, tempPath } from '@mamis/magento2-gulp/helpers/paths'

export default function(name, file) {
    const theme = themes()[name]

    const source = path.join(tempPath, theme.destination)
    const sources = []
    const destinations = []
    const includePaths = theme.includePaths ? theme.includePaths : []
    const stylesDir = theme.stylesDir ? theme.stylesDir : ''

    const production = false//env.prod || false
    // const browserslist = config('browserslist.yml')

    // Add SCSS files to the list of sources we wish to process
    sources.push(file || source + '/**/*.scss')

    // Add the include path direcotires to the areas we do not wish to process
    // (avoids processing node asset dependancies that are not called upon from within the theme)
    includePaths.forEach(
        includePath => {
            sources.push('!' + path.join(tempPath, theme.destination, includePath, '**'))
        }
    )

    theme.locale.forEach(
        locale => {
            destinations.push(
                path.join(projectPath, theme.destination, locale, stylesDir)
            )
        }
    )

    // Run tasks on all Sass files
	const gulpTask = src(sources)
        .pipe(
            sass(
                {
                    includePaths: includePaths.map(
                        (includePath) => {
                           return path.join(tempPath, theme.destination, includePath)
                        }
                    ),
                    outFile: './',
                    outputStyle: 'expanded',
                    sourceComments: true
                }
            )
        )
        // .pipe(
        //     rename(adjustDestinationDirectory)
        // )
        // .pipe(
        //     postcss([
        //         // @TODO: Move to configurable setting
        //         postcssLogical({
        //             dir: 'ltr',
        //             preserve: true
        //         }),
        //         prefix({
        //             cascade: true,
        //             remove: true
        //         })
        //     ])
        // )
        .pipe(
            multiDest(destinations)
        )
        .pipe(
            logger({
                display: 'name',
                beforeEach: 'Theme: ' + name + ' ',
                afterEach : ' Compiled!'
            })
        );

    if (production) {
        gulpTask = gulpTask.pipe(
                rename({
                    extname: '.min.css'
                })
            )
            .pipe(
                postcss([
                    minify({
                        discardComments: {
                            removeAll: true
                        }
                    })
                ])
            )
            .pipe(
                multiDest(destinations)
            )
            .pipe(
                logger({
                    display: 'name',
                    beforeEach: 'Theme: ' + name + ' ',
                    afterEach : ' Compiled!'
                })
            );
    }

    return gulpTask
}
