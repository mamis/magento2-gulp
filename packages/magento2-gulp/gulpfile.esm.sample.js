import { parallel } from 'gulp'

import { setup as setupTask } from '@mamis/magento2-gulp'
import { inheritance as inheritanceTask } from '@mamis/magento2-gulp'
import { clean as cleanTask } from '@mamis/magento2-gulp-clean'
import { copy as copyTask } from '@mamis/magento2-gulp-copy'
import { less as lessTask } from '@mamis/magento2-gulp-less'
import { sass as sassTask } from '@mamis/magento2-gulp-sass'

export const setup = setupTask
export const inheritance = inheritanceTask
export const clean = cleanTask
export const copy = copyTask

export const less = lessTask
export const sass = sassTask

export const styles = series(
    inheritance,
    parallel(lessTask, sassTask)
)
