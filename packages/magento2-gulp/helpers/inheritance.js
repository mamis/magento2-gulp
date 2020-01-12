/**
 * Facilitates Theme Inheritance logic, including..
 * - If a parent theme is specified, creates symlinks of all
 *   assets that are to be inherited from the parent theme
 */
import fs from 'fs-extra'
import globby from 'globby'
import path from 'path'

import { projectPath, tempPath } from './paths'
import themes from './themes'

export default (name, tree = true) => {
    const themeConfigs = themes()

    return new Promise(
        resolve => {
            module.exports.themeDependencyTree(name, tree).forEach(
                themeName => {
                    const theme = themeConfigs[themeName]
                    const themeSource = path.join(projectPath, theme.source)
                    const themeDestination = path.join(tempPath, theme.destination)

                    // Clean destination dir before generating new symlinks
                    fs.removeSync(themeDestination)

                    // return

                    // Inherit the data from the theme
                    module.exports.inherit(themeSource, themeDestination, '', theme.ignore)

                    // Inherit from all declared theme modules
                    if (theme.modules) {
                        Object.keys(theme.modules).forEach(
                            name => {
                                const themeModuleSources = path.join(projectPath, theme.modules[name])

                                module.exports.inherit(
                                    themeModuleSources,
                                    themeDestination,
                                    name + '/',
                                    theme.ignore
                                )
                            }
                        )
                    }

                    // Inherit from a parent theme if it exists
                    if (theme.parent) {
                        const parentThemeSource = path.join(tempPath, themeConfigs[theme.parent].destination)

                        module.exports.inherit(parentThemeSource, themeDestination, '', themeConfigs[theme.parent].ignore)
                    }

                    // Inherit Magento UI Library if this is a less-based theme
                    if (true || theme.dsl == 'less') {
                        module.exports.inherit(
                            path.join(projectPath, 'lib/web/css/source'),
                            path.join(themeDestination, 'web/css/source'),
                            '',
                            theme.ignore
                        )
                    }
                }
            )

            resolve()
        }
    )
}

export const inherit = (source, destination, replacePattern, ignorePatterns = []) => {
    const sourcePaths = [];

    // Load all files from the source path
    sourcePaths.push(source + '/**');

    // Add ignore patterns to the sourcePaths list
    ignorePatterns.map(
        ignorePattern => {
            sourcePaths.push('!**/' + ignorePattern)
        }
    )

    // Find all files matching the required sourcePaths
    const filePaths = globby.sync(
        sourcePaths,
        {
            nodir: true
        }
    )

    // For each filepath identified, create a symlink in the destination
    filePaths.forEach(
        filePath => {
            let sourcePath = filePath
            let destinationPath = path.join(destination, filePath).replace(source + '/', replacePattern + '/')

            // fs.removeSync(destinationPath)
            fs.copySync(
                sourcePath,
                destinationPath,
                {
                    overwrite: false
                }
            )
        }
    )
}

/**
 * Resolves the theme dependancy tree,
 * returned a sorted list of all themes
 */
export const themeDependencyTree = (themeName, tree, dependencyTree) => {
    const themeConfigs = themes()

    dependencyTree = dependencyTree ? dependencyTree : []
    dependencyTree.push(themeName)

    if (!tree) {
        return dependencyTree
    }

    if (themeConfigs[themeName].parent) {
        return module.exports.themeDependencyTree(
            themeConfigs[themeName].parent,
            tree,
            dependencyTree
        )
    }
    else {
        return dependencyTree.reverse()
    }
}
