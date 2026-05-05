window.addEventListener('load', () => {
	if (typeof VANTA === 'undefined' || typeof VANTA.DOTS !== 'function') {
		console.error("L'animazione di Vanta non è stata caricata correttamente.");
		return;
	}

	VANTA.DOTS({
		el: '#background',
		mouseControls: true,
		touchControls: true,
		gyroControls: false,
		minHeight: 200.0,
		minWidth: 200.0,
		scale: 1.0,
		scaleMobile: 1.0,
		color: 0xff8820,
		color2: 0xff8820,
		backgroundColor: 0x000000,
		size: 2.9,
		spacing: 25.0
	});
});

const sectionRoutes_JSON = {
	grafici: './Sezioni/Html/grafici.html',
	teoremi: './Sezioni/Html/teoremi.html',
	formule: './Sezioni/Html/formule.html',
	indovinelli: './Sezioni/Html/indovinelli.html'
};

function loadSection(sezione) {
	const destinazione = sectionRoutes_JSON[sezione];
	if (!destinazione) {
		console.warn(`Sezione non gestita: ${sezione}`);
		return;
	}

	window.location.href = destinazione;
}

document.querySelector('[data-section="teoremi"]').addEventListener('click', () => loadSection("teoremi"));
document.querySelector('[data-section="grafici"]').addEventListener('click', () => loadSection("grafici"));
document.querySelector('[data-section="indovinelli"]').addEventListener('click', () => loadSection("indovinelli"));
document.querySelector('[data-section="formule"]').addEventListener('click', () => loadSection("formule"));
