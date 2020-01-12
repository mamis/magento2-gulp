import fs from 'fs-extra'
import path from 'path'
import log from 'fancy-log'
import colors from 'ansi-colors'

import { projectPath } from '../helpers/paths'

export const setup = (callback) => {
    // Set config files paths
    const configSamplesPath = path.resolve(__dirname, '../config/')
    const configPath = path.join(projectPath, 'dev/tools/gulp/config/')

    // Copy the sample gulpfile into the projectPath
    try {
        fs.copySync(
            path.resolve(__dirname, '../gulpfile.esm.sample.js'),
            path.join(projectPath, 'gulpfile.esm.js'),
            {
                overwrite: false,
                errorOnExist: true
            }
        )

        log('File gulpfile.esm.js copied to ' + projectPath)
    }
    catch (error) {
        log(
            colors.yellow('File gulpfile.esm.js already exists. Skipped it.')
        )
    }

    // Copy all all non existent config files to /dev/tools/frontools/config/
    fs.readdirSync(configSamplesPath).forEach(
        (fileName) => {
            const newFileName = fileName.replace('.sample', '')

            try {
                fs.copySync(
                    path.join(configSamplesPath, fileName),
                    path.join(configPath, newFileName), {
                        overwrite: false,
                        errorOnExist: true
                    }
                )

                log('File ' + fileName + ' copied to /dev/tools/gulp/config/' + newFileName)
            }
            catch (error) {
                log(
                    colors.yellow('File ' + newFileName + ' already exists. Skipped it.')
                )
            }
        }
    )

    log(
        colors.green('Setup complete! Go to "/dev/tools/gulp/config/" directory and edit the configuration there.')
    )

    callback()
}
