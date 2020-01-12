import mergeStream from 'merge-stream'
import helper from './helpers/less'
import { themeNames } from '@mamis/magento2-gulp/helpers/themes'

export const less = () => {
    const streams = mergeStream()

    themeNames().forEach(
        name => {
            streams.add(helper(name))
        }
    )

    return streams
}
