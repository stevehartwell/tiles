//

import { SettingsUI } from './settings'
import { PopupMenu } from './popupMenu'

// Complete SortableJS (with all plugins)
// import Sortable from 'sortablejs/modular/sortable.complete.esm.js';
import Sortable, { MultiDrag, Swap } from 'sortablejs'
Sortable.mount(new MultiDrag(), new Swap())

const settings = new SettingsUI()
const settingsPopover = (() => {
    const settingsPopover = document.getElementById('settingsPopover')
    if (!settingsPopover) throw 'document#settingsPopover'
    return settingsPopover as HTMLElement
})()

const tableau = makeTableau()

//
const searchParams = new URLSearchParams(window.location.search)
const labels = searchParams.get('labels')
addTileGroup(labels ? labels : 'A')

//------------------------------------------------------------------------------

function makeTableau() {
    const tableau = document.getElementById('tableau')
    if (!tableau) throw "document#tableau"
    new Sortable(tableau, {
        group: {
            name: "outer",
            // pull: [true, false, 'clone', array],
            // put: [true, false, array]
        },
        multiDrag: true, // to show selected group(s)
        multiDragKey: 'META', // Key that must be down for additional items to be selected
        // avoidImplicitDeselect: false, // true - if you don't want to deselect items on outside click
        fallbackTolerance: 3, // So that we can select items on mobile
        animation: 500
    })

    const mainMenuPopup = (() => {
        const mainMenu = document.getElementById('mainMenu')
        if (!mainMenu) throw 'document#mainMenu'
        return new PopupMenu(mainMenu)
    })()
    const mainMenuClickHandler = (clickEv: MouseEvent) => {
        console.debug('mainMenuItems click: ', clickEv.target)
        const clickedElem = clickEv.target as HTMLElement
        switch (clickedElem?.getAttribute('value')) {
            case 'addTileGroup':
                addTileGroup('A')
                break
            case 'setDefaults':
                settingsPopover.showPopover()
                break
            default:
                console.error('click target: ', clickEv.target)
                break
        }
    }

    const mainMenuButton = document.getElementById('hamburger')
    if (!mainMenuButton) throw 'document#hamburger'
    mainMenuButton.addEventListener('click', (clickEv: MouseEvent) => {
        mainMenuPopup.showAtMouseLocation(clickEv, mainMenuClickHandler)
    })

    tableau.addEventListener('contextmenu', (mouseEv: MouseEvent) => {
        console.debug('tableau contextmenu target: ', mouseEv.target)
        mainMenuPopup.showAtMouseLocation(mouseEv, mainMenuClickHandler)
    })

    tableau.addEventListener('keydown', (kbEv: KeyboardEvent) => {
        console.debug('tableau keydown:', kbEv.key, ' target:', kbEv.target)
        switch (String(kbEv.code)) {
            case 'Backspace':
                if (!kbEv.metaKey) {
                    break
                }
            // falls through
            case 'Delete':
                tableau.querySelectorAll('.sortable-selected')
                    .forEach(sel => sel.remove())
                kbEv.stopPropagation()
                kbEv.preventDefault()
                break
        }
    })

    return tableau
}

function addTileGroup(labels: string) {
    const tileGroup = document.createElement('div')
    tileGroup.classList.add('tile-group')
    tileGroup.classList.add('tile-layout')
    tileGroup.tabIndex = 0 // make focusable for keyDown events
    const firstTile = newTile('')
    tileGroup.replaceChildren(firstTile)
    makeTiles(firstTile, labels)
    const sortable = attachSortable(tileGroup, {
        animation: Number(settings.getValue('animationDuration')),
        swap: Boolean(settings.getValue('swap')),
        // draggable: '.tile:not(:empty)'
    })
    tileGroup.addEventListener('keydown', (kbEv: KeyboardEvent) => {
        console.debug('tileGroup keydown:', kbEv.key, ' target:', kbEv.target)
        switch (kbEv.code) {
            case 'Enter':
                kbEv.stopPropagation()
                kbEv.preventDefault()
            // falls thru
            case 'Tab':
                let tileElem = kbEv.target as HTMLElement
                Sortable.utils.deselect(tileElem)
                if (tileElem.isContentEditable) {
                    window?.getSelection()?.empty()
                    tileElem.removeAttribute('contentEditable')
                    clearIfEmpty(tileElem)
                    makeTiles(tileElem, tileElem.innerText)
                } else {
                    tileElem.contentEditable = 'true'
                    window?.getSelection()?.selectAllChildren(tileElem)
                }
                break
        }
    })
    tileGroup.addEventListener('contextmenu', (mouseEv: MouseEvent) => {
        console.debug('tileGroup contextmenu target: ', mouseEv.target)
        tileContextPopup.showAtMouseLocation(mouseEv, (clickEv: Event) => {
            // const sortable = Sortable.get(tileGroup)
            console.debug('tileContextMenu click sortable: ', sortable)
            sortable.options.swap = !(sortable.options.swap == true)
        })
    })
    tableau.appendChild(tileGroup)
}

const tileContextPopup = (() => {
    const tileContextMenu = document.getElementById('tileContextMenu')
    if (!tileContextMenu) throw 'document#tileContextMenu'
    return new PopupMenu(tileContextMenu)
})()


function makeTiles(firstTile: HTMLElement, labelsDescriptor: string) {
    function makeSplitParam(x: string) {
        return x.length <= 1 ? x : new RegExp(x)
    }
    const labelSep = makeSplitParam(settings.getValue('labelSep'))
    const rowSep = makeSplitParam(settings.getValue('rowSep'))

    let tileLabels = labelsDescriptor
        .split(rowSep)
        .reduce<string[]>((acc, val) => acc.concat(val.split(labelSep), '\n'), [])
    tileLabels.pop() // drop trailing \n

    console.debug('makeTiles: ', tileLabels.map(label => label.replaceAll('\n', '®')))

    // XXX applyLabel(firstTitle, tileLabels.shift())
    firstTile.innerText = tileLabels.shift() ?? ''
    if (tileLabels.length) {
        firstTile.after(...tileLabels.map((label) => {
            if (label === '\n') {
                // <br> does not work in a flex layout.
                const rowBreakElem = document.createElement('span')
                rowBreakElem.classList.add('tile-group-layout-break')
                return rowBreakElem
            }
            return newTile(label)
        }))
    }
}

function attachSortable(elem: HTMLElement, options: Sortable.Options) {
    const sortable = new Sortable(elem, {
        ...options,
        'group': 'inner', // or {put: xx, get: xx, xx: xx}
        'fallbackTolerance': 3, // So that we can select items on mobile
        // filter: '.no-drag',
        // avoidImplicitDeselect: false, // set true if you don't want to deselect items on outside click
        'multiDrag': true,   // needed to select
        'multiDragKey': 'META' as any // Key that must be down for additional items to be selected
    })

    // Options to filter draggables:
    //  filter: '.no-drag'
    //  draggable: /^[uo]l$/i.test(tileGroup.nodeName) ? '>li' : '>*',
    //  sortable.option('filter', (event: Event | TouchEvent, target: HTMLElement, zortable: Sortable) => {
    //     return false
    //  })

    // sortable.option('direction', 'vertical')
    // sortable.option('onMove', (evt: Sortable.MoveEvent, originalEvent: Event) => {
    //     // Example: https://jsbin.com/nawahef/edit?js,output
    //     // evt.dragged // dragged HTMLElement
    //     // evt.draggedRect // DOMRect {left, top, right, bottom}
    //     // evt.related // HTMLElement on which have guided
    //     // evt.relatedRect // DOMRect
    //     // evt.willInsertAfter // Boolean that is true if Sortable will insert drag element after target by default
    //     // originalEvent.clientY // mouse position
    //     return evt.related.className.indexOf('no-swap') === -1
    //     // return false; — for cancel
    //     // return -1; — insert before target
    //     // return 1; — insert after target
    //     // return true; — keep default insertion point based on the direction
    //     // return void; — keep default insertion point based on the direction
    // })
    // sortable.option('onChoose', (event: Sortable.SortableEvent) => {
    //     console.debug('onChoose', event.item.textContent)
    // })
    // elem.addEventListener('input', (e: Event) => {
    //     console.debug('group input', e)
    // })
    // elem.addEventListener('compositionend', (e: CompositionEvent) => {
    //     console.debug('group compositionend', e)
    // })
    return sortable
}

function newTile(itemLabel: string): HTMLElement {
    const tile = document.createElement('span')
    tile.classList.add('tile')
    if (itemLabel === '.') { // just testing
        return tile
    }
    tile.textContent = itemLabel
    // tile.classList.add('draggable')
    tile.tabIndex = 0 // make focusable
    tile.addEventListener('focusin', (ev: FocusEvent) => {
        console.debug('tile focusin target: ', ev.target)
    })
    tile.addEventListener('focusout', (ev: FocusEvent) => {
        console.debug('tile focusout target: ', ev.target)
        const elem = ev.target as HTMLElement
        clearIfEmpty(elem)
        elem.removeAttribute('contentEditable')
    })
    return tile
}

function clearIfEmpty(elem: HTMLElement) {
    if (elem.textContent?.length === 0) {
        elem.innerHTML = '' // remove spurious <br> child element
    }
}
