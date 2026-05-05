import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = `https://kjsuiaqglyrlgmtvqwcg.supabase.co`;
const anon_key = `sb_publishable_riMSkM9W0Y_w4I6FQLfmxQ_I6JcazlW`;
const supabase = createClient(supabaseUrl, anon_key);

let enunciati = [];
let currRiddleIndex = 0;
let selectedAnswer = null;
let correctAnswers = 0;
let questionsAnswered = 0;
let pendingPoint = false;

async function getTheorems() {
	const { data, error } = await supabase.from('indovinelli_list').select('answer, question');

	if (error) {
		console.error('Errore nel recupero degli indovinelli:', error);
		return [];
	}

	enunciati = data
		.map((item) => [item.answer, item.question])
		.filter((item) => {
			return (
				typeof item[0] === 'string' &&
				item[0].trim().length > 0 &&
				typeof item[1] === 'string' &&
				item[1].trim().length > 0
			);
		});

	console.log('Indovinelli recuperati:', enunciati);
	return enunciati;
}

function shuffle(array) {
	let currentIndex = array.length;

	while (currentIndex != 0) {
		let randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}

	return array;
}

function renderQuestion_and_options(questionIndex) {
	const currentQuestion = enunciati[questionIndex];
	if (!currentQuestion) {
		console.error('Domanda non trovata');
		return;
	}

	const questionHeader = document.querySelector('.container-question_box h1');
	const answerBox = document.querySelector('#riddle-answer-box');
	const answerText = document.querySelector('#riddle-answer');
	const revealButton = document.querySelector('#reveal-answer-btn');
	const addPointButton = document.querySelector('#add-point-btn');

	if (questionHeader) questionHeader.textContent = currentQuestion[1];
	if (answerText) answerText.textContent = currentQuestion[0];
	if (answerBox) answerBox.classList.remove('visible');
	if (revealButton) revealButton.textContent = 'Svela risposta';
	if (addPointButton) addPointButton.disabled = true;

	pendingPoint = false;
	selectedAnswer = null;

	updateScoreDisplay();
	updateQuestionNumber();
}

function initQuiz() {
	if (enunciati.length === 0) {
		console.error('Nessun indovinello disponibile');
		return;
	}

	selectedAnswer = null;
	correctAnswers = 0;
	questionsAnswered = 0;
	pendingPoint = false;

	updateScoreDisplay();
	updateQuestionNumber();

	currRiddleIndex = Math.floor(Math.random() * enunciati.length);
	renderQuestion_and_options(currRiddleIndex);

	attachRevealButtonListener();
	attachAddPointListener();
	updateProgressBar();
	console.log('Quiz indovinelli inizializzato correttamente');
}

function attachRevealButtonListener() {
	const revealButton = document.querySelector('#reveal-answer-btn');
	if (!revealButton) {
		console.error('Bottone #reveal-answer-btn non trovato');
		return;
	}

	revealButton.removeEventListener('click', handleRevealOrNext);
	revealButton.addEventListener('click', handleRevealOrNext);
}

function attachAddPointListener() {
	const addPointButton = document.querySelector('#add-point-btn');
	if (!addPointButton) {
		console.error('Bottone #add-point-btn non trovato');
		return;
	}

	addPointButton.removeEventListener('click', handleAddPoint);
	addPointButton.addEventListener('click', handleAddPoint);
}

function handleRevealOrNext() {
	const answerBox = document.querySelector('#riddle-answer-box');
	const revealButton = document.querySelector('#reveal-answer-btn');
	const addPointButton = document.querySelector('#add-point-btn');

	if (!answerBox || !revealButton) {
		return;
	}

	if (!answerBox.classList.contains('visible')) {
		answerBox.classList.add('visible');
		revealButton.textContent = 'Prossima domanda';
		if (addPointButton) addPointButton.disabled = false;
		return;
	}

	answerBox.classList.remove('visible');
    revealButton.textContent = 'Svela risposta';
    if (addPointButton) addPointButton.disabled = true;

    answerBox.addEventListener('transitionend', () => {
    if (pendingPoint) {
        correctAnswers++;
        pendingPoint = false;
        updateScoreDisplay();
    }

    questionsAnswered++;
    if (enunciati.length === 0) return;

    currRiddleIndex = Math.floor(Math.random() * enunciati.length);
    renderQuestion_and_options(currRiddleIndex);
    updateProgressBar();
}, { once: true });
}

function handleAddPoint() {
	const addPointButton = document.querySelector('#add-point-btn');
	if (!addPointButton || addPointButton.disabled) {
		return;
	}

	pendingPoint = true;
	addPointButton.disabled = true;
	addPointButton.textContent = 'Punto aggiunto';
	updateScoreDisplay();
}

function updateProgressBar() {
	const progressBar = document.querySelector('.progress-bar');
	if (progressBar && enunciati.length > 0) {
		const percentage = (correctAnswers / enunciati.length) * 100;
		progressBar.style.width = percentage + '%';
	}
}

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

function updateScoreDisplay() {
	const currentScore = document.querySelector('#current-score');
	if (currentScore) {
		currentScore.textContent = correctAnswers;
	}
}

document.addEventListener('DOMContentLoaded', async () => {
	// Start Quiz Button
	document.querySelector('.start_quiz-btn')?.addEventListener('click', () => {
		document.getElementById('dialog-domande').showModal();
	});

	// Close Dialog Button
	document.getElementById('dialog-chiudi')?.addEventListener('click', () => {
		document.getElementById('dialog-domande').close();
	});

	// Quiz Options Buttons
	document.querySelectorAll('.dialog-scelta').forEach(btn => {
		btn.addEventListener('click', async (e) => {
			document.getElementById('dialog-domande').close();
			
			const html = await fetch('../Html/indovinelli2.html').then(r => r.text());
			const newDoc = new DOMParser().parseFromString(html, 'text/html');
			document.documentElement.replaceWith(newDoc.documentElement);
			
			enunciati = [];
			correctAnswers = 0;
			questionsAnswered = 0;
			pendingPoint = false;
			currRiddleIndex = 0;
			selectedAnswer = null;
			
			await getTheorems();
			initQuiz();
			attachRevealButtonListener();
			attachAddPointListener();
			
			if (window.MathJax) {
				MathJax.typesetPromise().catch(err => console.error('MathJax error:', err));
			}
		});
	});

	// Initialize Quiz on page 1
	await getTheorems();
	initQuiz();
});
