/*
 *
 */

import { get } from "sortablejs"

const SettingIDs = [
    'labelSep', 'rowSep', 'animationDuration', 'swap'
] as const
type SettingKey = typeof SettingIDs[number]


class TilesSettings {
    #values = new Map<SettingKey, any>([
        ['labelSep', ''],
        ['rowSep', '\\n+'],
        ['animationDuration', 500],
        ['swap', false],
    ])

    constructor() {
    }

    getValue(key: SettingKey) {
        return this.#values.get(key)
    }
    setValue(key: SettingKey, value: any) {
        this.#values.set(key, value)
    }

    save() {

    }
}

/* ****** */

export class SettingsUI {
    #settings: TilesSettings
    #inputElems = new Map<string, HTMLInputElement | HTMLSelectElement>()

    constructor() {
        this.#settings = new TilesSettings()
        for (const key of SettingIDs) {
            const inputElem = this.getElementById(key)
            const value = this.#settings.getValue(key)
            this.setElementValue(inputElem, value)
        }
    }

    private getElementById(id: string) {
        const elem = document.getElementById(id)
        if (!elem) throw `document#${id}`
        elem.addEventListener('change', this.settingsElemChanged)
        return elem
    }

    getValue(key: SettingKey) {
        return this.#settings.getValue(key)
    }
    setValue(key: SettingKey, value: any) {
        this.#settings.setValue(key, value)
        const elem = this.#inputElems.get(key)
        if (!elem) throw `setValue ${key}`
    }

    private getElementValue(elem: HTMLElement) {
        if (elem instanceof HTMLInputElement) {
            switch (elem.type) {
                case 'checkbox':
                case 'radio':
                    return elem.checked
                default:
                    return elem.value
            }
        }
        else if (elem instanceof HTMLSelectElement) {
            return elem.value
        }
        else {
            throw `getElementValue: ${typeof elem}`
        }
    }
    private setElementValue(elem: HTMLElement, value: any) {
        if (elem instanceof HTMLInputElement) {
            switch (elem.type) {
                case 'checkbox':
                case 'radio':
                    elem.checked = Boolean(value)
                default:
                    elem.value = String(value)
            }
        }
        else if (elem instanceof HTMLSelectElement) {
            elem.value = String(value)
        }
        else {
            throw `setElementValue: ${typeof elem}`
        }
    }

    private settingsElemChanged = (ev: Event) => {
        const inputElem = ev.target as HTMLElement
        const key = inputElem.id as SettingKey
        const value = this.getElementValue(inputElem)
        console.debug('settingsElemChanged: ', key, value)
        this.#settings.setValue(key, value)
    }
}
