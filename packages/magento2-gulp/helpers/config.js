import path from 'path'
import fs from 'fs-extra'
import globby from 'globby'
import yaml from 'js-yaml'

import errorMessage from './error-message'
import { projectPath } from './paths'

export default (file, failOnError = true) => {
    const configPath = path.join(projectPath, 'dev/tools/gulp/config/', file)

    // Check if file exists inside the config directory
    if (globby.sync(configPath).length) {
        if (file.includes('yml')) {
            return yaml.safeLoad(fs.readFileSync(configPath))
        }
        else {
            return JSON.parse(fs.readFileSync(configPath))
        }
    }

    if (failOnError) {
        throw new Error(errorMessage('You have to create ' + file))
    }

    return {}
}
