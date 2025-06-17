

export class PopupMenu {
    readonly #container: HTMLElement
    #onClick?: (e: MouseEvent) => any

    constructor(container: HTMLElement) {
        this.#container = container
    }

    showAtMouseLocation(mouseEv: MouseEvent, onClick?: (ev: MouseEvent) => any) {
        this.#container.blur() // dismiss any pending listeners
        if (this.#onClick) {
            console.error('showAtMouseLocation already in use:', this.#onClick)
            throw 'showAtMouseLocation already in use'
        }
        this.#onClick = onClick

        mouseEv.stopPropagation()
        mouseEv.preventDefault()

        this.#container.addEventListener('click',
            (clickEv: MouseEvent) => {
                clickEv.stopPropagation()
                clickEv.preventDefault()
                console.debug('PopupMenu click: ', this.#container)
                this.#onClick?.(clickEv)
                this.#container.blur()
            },
            { once: true }
        )
        this.#container.addEventListener('focusout',
            (focusEv: FocusEvent) => {
                console.debug('PopupMenu focusout: ', this.#container)
                this.#container.style.display = 'none'
                this.#onClick = undefined
            },
            { once: true }
        )
        const menuStyle = this.#container.style
        menuStyle.setProperty('--mouse-x', mouseEv.clientX + 'px')
        menuStyle.setProperty('--mouse-y', mouseEv.clientY + 'px')
        menuStyle.display = 'block'
        this.#container.focus()
    }
}