// === Amikor az egér 2 másodpercnél tovább marad egy cellán ===
const tabla_osszhoz = document.getElementById("jelenletiTable");

if (tabla_osszhoz) {
    tabla_osszhoz.addEventListener('mouseover', (e) => {

        const cell = e.target.closest('td');
        if (!cell) return;
        const sor = cell.parentElement;
        const nevCella = sor ? sor.querySelector(".nev-oszlop") : null;
        const id = nevCella ? nevCella.dataset.id : null;
        if (!id) {
            return;
        } else {
            // Itt jön a 2 másodperces késleltetés
            setTimeout(() => {
                // Ellenőrizzük, hogy az egér még mindig a cellán van-e
                if (cell.matches(':hover')) {
                    // Itt hajtsd végre a műveletet, például megjeleníthetsz egy tooltip-et vagy kiemelheted a sort
                    osszesenKimutatasa(id); // Itt hívod meg a függvényt, ami megjeleníti az összesített adatokat az adott ID-hez
                }
            }, 1000);
        }
    });
}

function osszesenKimutatasa(id) {
    const osszmodal = document.getElementById("osszModal");
    const osszOraValue = document.getElementById("osszOraValue");
    const userData = JSON.parse(document.getElementById('user-data-json').textContent);
    const sor = userData.find(tomb => tomb.id === +id); // Megkeressük a tömbben a megfelelő ID-hez tartozó objektumot  
    if (!sor) {
        console.error('Nincs ilyen ID-hez tartozó adat:', id);
        return;
    } 

    const napok = sor.napok;
    let osszOra = 0;

    for (const key in napok) {
        const napSzama = key.replace('e', '');
        const erkezes = napok[napSzama + 'e'];
        const tavozas = napok[napSzama + 't'];
        if (erkezes && tavozas) {
            const erkezesIdo = new Date(`1970-01-01T${erkezes}:00`);
            const tavozasIdo = new Date(`1970-01-01T${tavozas}:00`);
            const oraKulonbseg = (tavozasIdo - erkezesIdo) / (1000 * 60 * 60); // Különbség órában
            osszOra += oraKulonbseg;
        }
    }

    if (osszOraValue) {
        osszOraValue.textContent = `${osszOra.toFixed(2)} óra`;
    }
    
    const idoPontModal = document.getElementById("idopontModal");
    if (idoPontModal.style.display === "block") {
        
    } else {
        osszmodal.style.display = "block";  // Megjelenítjük a modalt
    }
}


document.addEventListener('mousemove', () => {
    const osszmodal = document.getElementById("osszModal");
    if (osszmodal && osszmodal.style.display === "block") {
        osszmodal.style.display = "none";
    }
});