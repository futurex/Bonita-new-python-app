
const modal = document.getElementById('idopontModal');
const dolgozoModal = document.getElementById('dolgozoModal');
const table = document.getElementById('jelenletiTable');
const headerRows = table.querySelectorAll('thead tr'); // Az összes fejléc sor
let sikerModalFrissitessel = false;
let szemelyId = 0;
let nap = 0;
let erkezes = '00:00'
let tavozas = '00:00'
let oraber = 0;
let napiber = 0;
let honapnevsorID = 0;
const ev = Number(document.getElementById('aktualis-ev').value);
const honap = Number(document.getElementById('aktualis-honap').value);
const menuButton = document.getElementById('menuButton');
const menuModal = document.getElementById('menuModal');
const dolgozoLista = document.getElementById('dolgozoLista');
const selectedDolgozoIdInput = document.getElementById('selectedDolgozoId');

function setDolgozoKivalasztasByElement(elem) {
    if (!elem || !dolgozoLista || !selectedDolgozoIdInput) return;

    dolgozoLista.querySelectorAll('.dolgozo-lista-item').forEach(item => {
        item.classList.remove('is-selected');
        item.setAttribute('aria-selected', 'false');
    });

    elem.classList.add('is-selected');
    elem.setAttribute('aria-selected', 'true');
    selectedDolgozoIdInput.value = elem.dataset.id || '';
}

function selectDolgozoFromList(elem) {
    setDolgozoKivalasztasByElement(elem);
}

if (dolgozoLista) {
    dolgozoLista.addEventListener('keydown', (event) => {
        const items = Array.from(dolgozoLista.querySelectorAll('.dolgozo-lista-item'));
        if (!items.length) return;

        const currentIndex = items.findIndex(item => item.classList.contains('is-selected'));

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            setDolgozoKivalasztasByElement(items[nextIndex]);
            items[nextIndex].scrollIntoView({ block: 'nearest' });
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            setDolgozoKivalasztasByElement(items[prevIndex]);
            items[prevIndex].scrollIntoView({ block: 'nearest' });
        }

        if (event.key === 'Enter' && currentIndex >= 0) {
            event.preventDefault();
            setDolgozoKivalasztasByElement(items[currentIndex]);
        }
    });
}

function clearColumnHighlights() {
    table.querySelectorAll('th.highlight-column').forEach(th => {
        th.classList.remove('highlight-column');
    });
}

function setIdopontModalState(isOpen) {
    modal.style.display = isOpen ? 'block' : 'none';
    table.classList.toggle('idopont-modal-open', isOpen);

    if (isOpen) {
        clearColumnHighlights();
    }
}

function positionMenuModal() {
    if (!menuButton || !menuModal) return;

    const buttonRect = menuButton.getBoundingClientRect();
    const gap = 8;

    menuModal.style.left = `${buttonRect.left}px`;
    menuModal.style.top = `${buttonRect.bottom + gap}px`;

    const modalRect = menuModal.getBoundingClientRect();
    const overflowRight = modalRect.right - window.innerWidth;
    if (overflowRight > 0) {
        menuModal.style.left = `${Math.max(8, buttonRect.left - overflowRight - 8)}px`;
    }
}

function toggleMenuModal(forceOpen) {
    if (!menuButton || !menuModal) return;

    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !menuModal.classList.contains('is-open');
    menuModal.classList.toggle('is-open', shouldOpen);
    menuButton.setAttribute('aria-expanded', String(shouldOpen));
    menuModal.setAttribute('aria-hidden', String(!shouldOpen));

    if (shouldOpen) {
        positionMenuModal();
    }
}

if (menuButton && menuModal) {
    menuButton.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleMenuModal();
    });

    menuModal.addEventListener('click', (event) => {
        const menuItem = event.target.closest('.menu-modal-item');
        if (!menuItem) return;
        toggleMenuModal(false);
    });

    document.addEventListener('click', (event) => {
        if (!menuModal.classList.contains('is-open')) return;

        const target = event.target;
        if (menuModal.contains(target) || menuButton.contains(target)) return;
        toggleMenuModal(false);
    });

    window.addEventListener('resize', () => {
        if (menuModal.classList.contains('is-open')) {
            positionMenuModal();
        }
    });

    window.addEventListener('scroll', () => {
        if (menuModal.classList.contains('is-open')) {
            positionMenuModal();
        }
    }, true);
}

function napOszlopokMeretezese() {
    if (!table || !table.rows.length) return;

    const osszesSor = Array.from(table.rows);
    const napOszlopokSzama = (osszesSor[0]?.cells.length || 0) - 1;
    if (napOszlopokSzama <= 0) return;

    const kontenerSzelesseg = table.parentElement?.clientWidth || table.clientWidth;
    const minNapOszlopSzelesseg = 18;
    const minNevOszlopSzelesseg = 120;
    const maxNevOszlopSzelesseg = Math.max(minNevOszlopSzelesseg, Math.floor(kontenerSzelesseg * 0.45));

    const merendoElsoCellak = osszesSor.map(sor => sor.cells[0]).filter(Boolean);
    const nevOszlopTartalomSzelesseg = Math.max(...merendoElsoCellak.map(cella => cella.scrollWidth || 0), minNevOszlopSzelesseg);

    let nevOszlopSzelesseg = Math.min(Math.max(nevOszlopTartalomSzelesseg + 12, minNevOszlopSzelesseg), maxNevOszlopSzelesseg);

    const napokMinimumSzelessege = napOszlopokSzama * minNapOszlopSzelesseg;
    if (kontenerSzelesseg - nevOszlopSzelesseg < napokMinimumSzelessege) {
        nevOszlopSzelesseg = Math.max(minNevOszlopSzelesseg, kontenerSzelesseg - napokMinimumSzelessege);
    }

    const maradekHely = Math.max(kontenerSzelesseg - nevOszlopSzelesseg, napokMinimumSzelessege);
    const napOszlopSzelesseg = Math.floor(maradekHely / napOszlopokSzama);

    osszesSor.forEach(sor => {
        if (sor.cells[0]) {
            sor.cells[0].style.width = `${nevOszlopSzelesseg}px`;
            sor.cells[0].style.minWidth = `${nevOszlopSzelesseg}px`;
            sor.cells[0].style.maxWidth = `${nevOszlopSzelesseg}px`;
        }

        for (let i = 1; i < sor.cells.length; i++) {
            sor.cells[i].style.width = `${napOszlopSzelesseg}px`;
            sor.cells[i].style.minWidth = `${napOszlopSzelesseg}px`;
            sor.cells[i].style.maxWidth = `${napOszlopSzelesseg}px`;
        }
    });
}

napOszlopokMeretezese();
window.addEventListener('resize', napOszlopokMeretezese);

// <============> Egér mozgatása a tábla felett, oszlop kiemelése fent <============
table.addEventListener('mouseover', (e) => {
    if (table.classList.contains('idopont-modal-open')) return;

    const cell = e.target.closest('td');
    if (!cell) return;
    const colIndex = cell.cellIndex; // Megnézzük, hányadik oszlop (pl. a 2.)

    // Előző kiemelések törlése, hogy ne maradjon beragadva.
    clearColumnHighlights();

    // Az első (név) oszlopot nem emeljük ki.
    if (colIndex === 0) return;

    // Végigmegyünk minden fejléc soron (legyen az 1, 2 vagy több)
    headerRows.forEach(row => {
        // Kikeressük az adott sorban az oszlopnak megfelelő fejléc cellát
        const th = row.cells[colIndex];
        if (th) {
            th.classList.add('highlight-column');
        }
    });
});

table.addEventListener('mouseout', (e) => {
    // Amikor elhagyjuk a cellát, töröljük az összes kiemelést
    clearColumnHighlights();
});

// <============> Click a tábla felett, időpont kiválasztása, -> ID <============
document.getElementById("jelenletiTable").addEventListener("click", (event) => {
    const cella = event.target.closest("td");
    if (!cella) return;

    const idopontCella = cella.querySelector(".click-box"); // <div class="click-box" data-ido="3">11:00</div>
    if (!idopontCella) return;

    const userData = JSON.parse(document.getElementById('user-data-json').textContent); // tablaErkezesTavozas tömb összes eleme
    nap = idopontCella.dataset.ido;

    const sor = cella.parentElement; // a klikkelt elem szülője
    const nevCella = sor.querySelector(".nev-oszlop");

    if (nevCella) {
        console.log("Kiválasztott személy neve:", nevCella.dataset.nev);
        szemelyId = +nevCella.dataset.id; // klikk után a kiválasztott sor dolgozó ID-je
        const napok = (userData.filter(item => item.id === szemelyId))[0].napok;
        oraber = (userData.filter(item => item.id === szemelyId))[0].oraber;
        napiber = (userData.filter(item => item.id === szemelyId))[0].napiber;
        honapnevsorID = (userData.filter(item => item.id === szemelyId))[0].honapnevsorID;


        if (napok[nap + 'e']) {
            erkezes = napok[nap + 'e'];
        }
        if (napok[nap + 't']) {
            tavozas = napok[nap + 't'];
        }

        // - modal - 
        document.getElementById("modal-id-tarolo").value = szemelyId;
        document.getElementById("ido1").value = erkezes;
        document.getElementById("ido2").value = tavozas;
        document.getElementById("modal-nev-kijelzo").innerText = nevCella.dataset.nev;
        setIdopontModalState(true);

    } else {
        console.error("Nem találom a .nev-oszlop osztályú cellát!");
    }

});

function erkezestavozasMentes() {

    const modal = document.getElementById("idopontModal");
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    erkezes = document.getElementById('ido1').value;
    tavozas = document.getElementById('ido2').value;

    const adat = {
        dolgozoId: szemelyId,
        oraber: oraber,
        napiber: napiber,
        honapnevsorID: honapnevsorID,
        ev: ev,
        honap: honap,
        nap: nap,
        erkezes: erkezes,
        tavozas: tavozas
    };

    console.log(adat);
    setIdopontModalState(false);

    fetch('/mentes/', {  // Itt a Django urls.py-ban megadott URL kell
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken, // Kötelező Django-nál!
        },
        body: JSON.stringify(adat) // JSON formátumra alakítjuk
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                window.location.reload();
            }
        })
        .catch((error) => {
            console.error('Hiba:', error);
        });

}


// <============> Gomobok kezelés <============
function closeModal() {
    setIdopontModalState(false);
}

function openDolgozoModal() {
    dolgozoModal.style.display = 'block';
    dolgozoModal.setAttribute('aria-hidden', 'false');

    if (dolgozoLista) {
        const firstItem = dolgozoLista.querySelector('.dolgozo-lista-item');
        if (firstItem && !dolgozoLista.querySelector('.dolgozo-lista-item.is-selected')) {
            setDolgozoKivalasztasByElement(firstItem);
        }
        dolgozoLista.focus();
    }
}

function closeDolgozoModal() {
    console.log("Bezárjuk az időpont modalt");
    dolgozoModal.style.display = 'none';
    dolgozoModal.setAttribute('aria-hidden', 'true');

}

if (dolgozoModal) {
    dolgozoModal.addEventListener('click', (event) => {
        if (event.target === dolgozoModal) {
            closeDolgozoModal();
        }
    });
}