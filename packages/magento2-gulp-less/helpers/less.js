import fs from 'fs-extra'
import path from 'path'
import globby from 'globby'
import { src } from 'gulp'
import cleanCss from 'gulp-clean-css'
import gulpif from 'gulp-if'
import logger from 'gulp-logger'
import less from 'gulp-less'
import multiDest from 'gulp-multi-dest'
import postcss from 'gulp-postcss'
import rename from 'gulp-rename'
import sourcemaps from 'gulp-sourcemaps'
import yargs from 'yargs'

import config from '@mamis/magento2-gulp/helpers/config'
import { themes } from '@mamis/magento2-gulp/helpers/themes'
import { projectPath, tempPath } from '@mamis/magento2-gulp/helpers/paths'

export default function(name, file) {
    const theme = themes()[name]
    const source = path.join(tempPath, theme.destination)
    const sources = []
    const destinations = []
    const includePaths = theme.includePaths ? theme.includePaths : []
    const stylesDir = theme.stylesDir ? theme.stylesDir : 'css'
    const production = yargs.argv.production ? true : false
    // const browserslist = config('browserslist.yml')
    let postcssPlugins = theme.postcss ? theme.postcss : []

    module.exports.resolveMagentoImport(theme)

    // Add less files to the list of sources we wish to process
    sources.push(file || source + '/**/[^_]*.less')

    // Evaluate postcss plugins to run in the pipeline
    postcssPlugins = postcssPlugins.map(
        postcssPlugin => eval(postcssPlugin)
    )

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
                path.join(projectPath, theme.destination, locale)
            )
        }
    )

    // Run tasks on all less files
	let gulpTask = src(sources)
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
        .pipe(
            rename(
                (file) => {
                    if (file.dirname.startsWith('web/css')) {
                        file.dirname = file.dirname.replace('web/css', stylesDir)
                    }

                    return file
                }
            )
        )
        .pipe(
            gulpif(
                postcssPlugins.length,
                postcss(postcssPlugins)
            )
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

    if (production) {
        gulpTask = gulpTask.pipe(sourcemaps.init())
            .pipe(
                rename({
                    extname: '.min.css'
                })
            )
            .pipe(
                cleanCss({
                    sourceMap: true,
                    inline: false
                })
            )
            .pipe(sourcemaps.write('.'))
            .pipe(
                multiDest(destinations)
            )
            .pipe(
                logger({
                    display: 'name',
                    beforeEach: 'Theme: ' + name + ' ',
                    afterEach : ' Minified!'
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
