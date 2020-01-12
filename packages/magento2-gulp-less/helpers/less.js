import { src } from 'gulp'
import fs from 'fs-extra'
import path from 'path'
import less from 'gulp-less'
import rename from 'gulp-rename'
import multiDest from 'gulp-multi-dest'
import logger from 'gulp-logger'
import postcss from 'gulp-postcss'
import globby from 'globby'

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

    module.exports.resolveMagentoImport(theme)

    // Add less files to the list of sources we wish to process
    sources.push(file || source + '/**/[^_]*.less')

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

    // Run tasks on all less files
	const gulpTask = src(sources)
        .pipe(
            less(
                {
                    paths: includePaths.map(
                        (includePath) => {
                            return path.join(tempPath, theme.destination, includePath)
                        }
                    )
                }
            )
        )
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

export const resolveMagentoImport = (theme) => {
    const source = path.join(tempPath, theme.destination)

    const lessFiles = globby.sync([
        source + '/**/*.less',
        '!' + src + '/node_modules/**/*.less'
    ])

    // Scan through all less files for "@magento_import" directive
    lessFiles.forEach(
        (file) => {
            let fileData = fs.readFileSync(file, 'UTF-8');
            const magentoImportRegex = new RegExp(
                /^\/\/@magento_import\s+[\'"](?<reference>(.*))[\'"];(?<additional>.*)$/gm
            );

            let magentoImport = null;

            while (magentoImport = magentoImportRegex.exec(fileData)) {
                let resolvedMagentoImports = []
                let moduleFiles = []

                if (magentoImport.groups.additional) {
                    resolvedMagentoImports.push(`${magentoImport.groups.additional}`)
                }

                // Add modules found matching the reference requested
                moduleFiles = globby.sync([
                    path.join(source, '**/web/css', magentoImport.groups.reference)
                ])

                moduleFiles.forEach(
                    (moduleFile) => {
                        const relativeModuleFile = path.relative(path.dirname(file), moduleFile)

                        resolvedMagentoImports.push(
                            `@import '${relativeModuleFile}';`
                        )
                    }
                )

                fileData = fileData.replace(
                    magentoImport[0],
                    resolvedMagentoImports.join("\n")
                );

                fs.writeFileSync(
                    file,
                    fileData,
                    'utf8',
                    (err) => {
                        if (err) {
                            return console.log(err);
                        }
                    }
                );
            }
        }
    );
}
