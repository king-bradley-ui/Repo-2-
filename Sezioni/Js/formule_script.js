import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = `https://kjsuiaqglyrlgmtvqwcg.supabase.co`;
const anon_key = `sb_publishable_riMSkM9W0Y_w4I6FQLfmxQ_I6JcazlW`;
const supabase = createClient(supabaseUrl, anon_key);



/* funzione per RECUPERARE le formule direttamente da SupaBase */
let enunciati = [];
let currTheoremIndex = 0;
async function getTheorems() {
	const { data, error } = await supabase.from('formulas_list').select('answer, formula');

	if (error) {
		console.error('Errore nel recupero delle formule:', error);
		return [];
	}

	enunciati = data
		.map((item) => [item.answer, item.formula])
		.filter((item) => {
			return (
				typeof item[0] === 'string' &&
				item[0].trim().length > 0 &&
				typeof item[1] === 'string' &&
				item[1].trim().length > 0
			);
		});

	console.log('Formule recuperate:', enunciati);
	return enunciati;
}



/* funzione per MISCHIARE l'array delle formule, utilizzo il Fisher-Yates */
function shuffle(array) {
	let currentIndex = array.length;

	while (currentIndex != 0) {
		let randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}

	return array;
}



/* funzione per le RISPOSTE MULTIPLE */
function generateMultipleChoiceOptions(currQuestion, allTheorems) {
	const correctAnswer = currQuestion[0];
	const wrongAnswers = allTheorems.filter((teorema) => teorema[0] !== correctAnswer).map((teorema) => teorema[0]);

	shuffle(wrongAnswers);

	const options = [correctAnswer, ...wrongAnswers.slice(0, 3)];
	return shuffle(options);
}



/* Funzione per mostrare la FORMULA e le OPZIONI dentro ai bottoni */
function renderQuestion_and_options(questionIndex) {
	const currentQuestion = enunciati[questionIndex];
	if (!currentQuestion) {
		console.error('Domanda non trovata');
		return;
	}

	const questionHeader = document.querySelector('.container-question_box h1');
	const answerButtons = document.querySelectorAll('.answer-btn');

	answerButtons.forEach(btn => {
		btn.classList.remove('selected');
		btn.classList.remove('disabled');
	});

	const enunciato = normalizeFormulaText(fixLatexEnvironments(currentQuestion[1]));
	if (questionHeader) questionHeader.innerHTML = `$$${enunciato}$$`;

	const options = generateMultipleChoiceOptions(currentQuestion, enunciati);

	answerButtons.forEach((button, index) => {
		const optionText = button.querySelector('.option-text');
		const optionValue = options[index] ?? '';
		if (optionText) {
			optionText.textContent = `${String.fromCharCode(65 + index)}) ${optionValue}`;
		}
		if (button) {
			button.dataset.isCorrect = optionValue === currentQuestion[0] ? 'true' : 'false';
			button.dataset.optionValue = optionValue;
		}
	});

	const questionBox = document.querySelector('.container-question_box');
	if (questionBox && window.MathJax) {
		MathJax.typesetClear([questionBox]);
		MathJax.typesetPromise([questionBox]).catch(err => console.error('MathJax error:', err));
	}
}

/* all'interno del database ho scritto alcune formule in maniera non ottimale, con delimitatori annidati del tipo $$ $E=mc^2$  $$ oppure $$ \[formula\] $$, quindi devo normalizzare il testo prima di poter procedere*/
function normalizeFormulaText(text) {
	if (typeof text !== 'string') {
		return '';
	}

	let normalized = text.trim();
	normalized = normalized.replace(/^\$\$\s*/g, '').replace(/\s*\$\$$/g, '');
	normalized = normalized.replace(/^\$\s*/g, '').replace(/\s*\$$/g, '');
	normalized = normalized.replace(/^\\\[\s*/g, '').replace(/\s*\\\]$/g, '');

	return normalized.trim();
}



function initQuiz() {
	if (enunciati.length === 0) {
		console.error('Nessuna formula disponibile');
		return;
	}

	selectedAnswer = null;
	correctAnswers = 0;
	questionsAnswered = 0;

	const allButtons = document.querySelectorAll('.answer-btn');
	allButtons.forEach(btn => {
		btn.classList.remove('selected');
		btn.classList.remove('disabled');
	});

	updateProgressBar();
	updateQuestionNumber();

	currTheoremIndex = Math.floor(Math.random() * enunciati.length);
	renderQuestion_and_options(currTheoremIndex);

	attachAnswerListeners();
	attachNextButtonListener();
}

function attachAnswerListeners() {
	const answerContainer = document.querySelector('.answer_options');

	if (!answerContainer) {
		console.error('Container .answer_options non trovato');
		return;
	}

	answerContainer.removeEventListener('click', handleAnswerSelectionDelegated);
	answerContainer.addEventListener('click', handleAnswerSelectionDelegated);
}


function attachNextButtonListener() {
	const nextButton = document.querySelector('.next-btn');
	if (!nextButton) {
		console.error('Bottone .next-btn non trovato');
		return;
	}

	nextButton.removeEventListener('click', handleNextQuestion);
	nextButton.addEventListener('click', handleNextQuestion);
}


/* funzione per cliccare una sola risposta con Event Delegation */
function handleAnswerSelectionDelegated(event) {
	const button = event.target.closest('.answer-btn');
	if (!button) {
		return;
	}

	if (!button.hasAttribute('data-is-correct')) {
		console.error('Bottone non ha attributo data-is-correct', button);
		return;
	}

	const allButtons = document.querySelectorAll('.answer-btn');
	allButtons.forEach(btn => btn.classList.remove('selected'));

	button.classList.add('selected');
	selectedAnswer = button;
}


/* Quando clicchi Domanda Successiva, valuta la risposta e avanza */
function handleNextQuestion() {
	let selectedButton = document.querySelector('.answer-btn.selected');

	if (!selectedButton && selectedAnswer) {
		selectedButton = selectedAnswer;
	}

	if (!selectedButton) {
		alert('Seleziona una risposta prima di continuare!');
		return;
	}

	if (!selectedButton.hasAttribute('data-is-correct')) {
		alert('Errore: risposta non configurata correttamente. Ricaricare la pagina.');
		return;
	}

	const isCorrect = selectedButton.dataset.isCorrect === 'true';

	if (isCorrect) {
		correctAnswers++;
		updateProgressBar();
	}

	questionsAnswered++;

	if (enunciati.length > 0) {
		selectedAnswer = null;

		const allButtons = document.querySelectorAll('.answer-btn');
		allButtons.forEach(btn => btn.classList.remove('selected'));

		currTheoremIndex = Math.floor(Math.random() * enunciati.length);

		renderQuestion_and_options(currTheoremIndex);
		updateQuestionNumber();

		attachAnswerListeners();
	}
}



/* MathJax renderizza solo formule, perciò convertiamo enumerate/itemize in HTML */
function fixLatexEnvironments(text) {
	text = text.replace(
		/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g,
		(match, content) => {
			const items = content
				.split(/\\item/)
				.filter(s => s.trim().length > 0)
				.map(s => `<li>${s.trim()}</li>`)
				.join('');
			return `<ol>${items}</ol>`;
		}
	);

	text = text.replace(
		/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g,
		(match, content) => {
			const items = content
				.split(/\\item/)
				.filter(s => s.trim().length > 0)
				.map(s => `<li>${s.trim()}</li>`)
				.join('');
			return `<ul>${items}</ul>`;
		}
	);

	return text;
}



/* variabili per tracciare lo stato del quiz */
let selectedAnswer = null;
let correctAnswers = 0;
let questionsAnswered = 0;


/* aggiorniamo la barra di avanzamento */
function updateProgressBar() {
	const progressBar = document.querySelector('.progress-bar');
	if (progressBar && enunciati.length > 0) {
		const percentage = (correctAnswers / enunciati.length) * 100;
		progressBar.style.width = percentage + '%';
	}
}


/* aggiorniamo il numero della domanda corrente */
function updateQuestionNumber() {
	const currentQuestionSpan = document.querySelector('#current-question');
	const totalQuestionsSpan = document.querySelector('#total-questions');

	if (currentQuestionSpan) {
		currentQuestionSpan.innerHTML = '&nbsp;' + (questionsAnswered + 1) + '&nbsp;';
	}

	if (totalQuestionsSpan) {
		totalQuestionsSpan.innerHTML = '&nbsp;' + enunciati.length + '&nbsp;';
	}
}



document.addEventListener('DOMContentLoaded', async () => {
	await getTheorems();
	initQuiz();
});


const btn = document.querySelector('.start_quiz-btn');
const dialog = document.getElementById('dialog-domande');
const chiudi = document.getElementById('dialog-chiudi');
const scelte = document.querySelectorAll('.dialog-scelta');

btn.addEventListener('click', () => dialog.showModal());
chiudi.addEventListener('click', () => dialog.close());

scelte.forEach(s => {
    s.addEventListener('click', () => {
        const nDomande = s.dataset.n;
        dialog.close();
        // Passa il numero alla pagina del quiz
        window.location.href = `formule2.html?domande=${nDomande}`;
    });
});