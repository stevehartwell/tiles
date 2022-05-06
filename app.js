//

// const Sortable = require("./Sortable-1.15.0/Sortable");

var tileRows = document.getElementById('tile-rows');
Sortable.create(tileRows, {
    group: {
        name: "outer",
        // pull: [true, false, 'clone', array],
        // put: [true, false, array]
    },
    multiDrag: true,
    multiDragKey: 'META', // Key that must be down for additional items to be selected
    avoidImplicitDeselect: false, // true - if you don't want to deselect items on outside click
    fallbackTolerance: 3, // So that we can select items on mobile
    animation: 500,
});

tileRows.addEventListener('keydown', (e) => {
    switch (String(e.code)) {
        case "Backspace": {
            if (!e.metaKey) {
                break;
            }
        }
        // falls through
        case "Delete":
            for (let sel of tileRows.querySelectorAll('.sortable-selected')) {
                sel.remove();
            }
            e.preventDefault();
            break;
    }
});

function formSubmit(form) {
    const data = new FormData(form)
    addRow(data.get('letters'), data.get('doSwap') == 'on' ? 'swap' : '');
    return false;
}

function addRow(letters, method) {
    if (letters.length < 1) {
        return;
    }
    var tileRow = document.createElement('div');
    tileRow.classList.add('tile-row');
    tileRow.tabIndex = 0; // make focusable for keyDown events
    tileRow.replaceChildren(...letters.split('').map((itemLabel) => {
        const tile = document.createElement('span');
        tile.classList.add('tile-square');
        tile.textContent = itemLabel;
        tile.tabIndex = 0; // make focusable
        tile.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'Enter':
                    e.preventDefault();
                    // falls thru
                case 'Tab':
                    Sortable.utils.deselect(e.target);
                    if (e.target.isContentEditable) {
                        window.getSelection().empty();
                        e.target.contentEditable = false;
                    } else {
                        e.target.contentEditable = true;
                        window.getSelection().selectAllChildren(e.target);
                    }
                    break;
            }
        });
        tile.addEventListener('focusout', (e) => {
            e.target.contentEditable = false;
        });
        return tile;
    }));
    Sortable.create(tileRow, {
        group: "inner",
        swap: method == 'swap',
        multiDrag: true,
        multiDragKey: 'META', // Key that must be down for additional items to be selected
        avoidImplicitDeselect: false, // true - if you don't want to deselect items on outside click
        fallbackTolerance: 3, // So that we can select items on mobile
        animation: 500,
    });
    tileRows.appendChild(tileRow);
}

//
var lettersInput = document.getElementById('letters');
lettersInput.addEventListener('keydown', (e) => {
    if (String(e.code) == 'Enter') {
        lettersInput.select();
    }
});

//
for (let letters of new URLSearchParams(window.location.search).keys()) {
    addRow(letters, '');
}