import { src } from 'gulp'
import del from 'del'
import vinylPaths from 'vinyl-paths'

import { projectPath } from '@mamis/magento2-gulp/helpers/paths'

export const clean = () => {
    // Remove all files under pub/static, except .htaccess
    return src(
            [
                projectPath + '/pub/static/*',
                '!' + projectPath + '/pub/static/.htaccess'
            ],
            {
                read: false
            }
        )
        .pipe(
            vinylPaths(
                paths => del(
                    paths,
                    {
                        force: true
                    }
                )
            )
        )
}
