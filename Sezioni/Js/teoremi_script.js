import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = `https://kjsuiaqglyrlgmtvqwcg.supabase.co`;
const anon_key = `sb_publishable_riMSkM9W0Y_w4I6FQLfmxQ_I6JcazlW`;
const supabase = createClient(supabaseUrl, anon_key); 



/* funzione per RECUPERARE gli enunciati dei teoremi direttamente da SupaBase */
let enunciati = []; // me la dichiaro come variabile globale
let currTheoremIndex = 0; // indice dell'attuale teorema
async function getTheorems() {
  const { data, error } = await supabase.from('theorems_list').select('corrans, enunciato');
  
  if (error) {
    console.error('Errore nel recupero dei teoremi:', error);
    return [];
  }
  
  enunciati = data
    .map((item) => [item.corrans, item.enunciato])
    .filter((item) => {
      return (
        typeof item[0] === 'string' &&
        item[0].trim().length > 0 &&
        typeof item[1] === 'string' &&
        item[1].trim().length > 0
      );
    });
  
  console.log('Enunciati recuperati:', enunciati);
  return enunciati;
}
getTheorems();

const startQuizButton = document.querySelector('.start_quiz-btn');
if (startQuizButton) startQuizButton.addEventListener('click', () => {
  const dialog = document.getElementById('dialog-domande');
  if (dialog) dialog.showModal();
});

// carico Teoremi2 via AJAX
document.querySelectorAll('.dialog-scelta').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const dialog = document.getElementById('dialog-domande');
    if (dialog) dialog.close();
    const n = parseInt(btn.dataset.n) || 30;
    await loadTeoremi2Page(n);
  });
});



/* andiamo alla pagine dei TEOREMI2, quella con i teoremi e le risposte multiple */ 
async function loadTeoremi2Page(nDomande = null) {
  try {
    console.log('Caricamento teoremi2.html...');
    const response = await fetch('../Html/teoremi2.html');

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const html = await response.text();
    const parsedDocument = new DOMParser().parseFromString(html, 'text/html');

    document.title = parsedDocument.title;
    // uso lo stile di teoremi2
    document.head.innerHTML = parsedDocument.head.innerHTML;
    document.body.innerHTML = parsedDocument.body.innerHTML;
    const newUrl = '../Html/teoremi2.html' + (nDomande ? `?domande=${nDomande}` : '');
    history.pushState({ page: 'teoremi2' }, '', newUrl);
    window.desiredQuestions = nDomande;

    console.log('Pagina caricata, recupero teoremi...');
    
    
    await getTheorems();
    console.log('Teoremi caricati:', enunciati.length);
    
    initQuiz();
    console.log('Quiz inizializzato');
  } catch (error) {
    console.error('Errore nel caricamento di teoremi2.html:', error);
  }
}



/* TORNIAMO alla schermata iniziale dei teoremi */ 
async function returnBackToTeoremi() {
    try {
        const response = await fetch('../Html/teoremi.html');
    
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const html = await response.text();
        const parsedDocument = new DOMParser().parseFromString(html, 'text/html');

        document.title = parsedDocument.title;
        document.body.innerHTML = parsedDocument.body.innerHTML;
        history.pushState({ page: 'teoremi' }, '', '../Html/teoremi.html');

    } catch (error) {
        console.error('Errore nel caricamento di teoremi.html:', error);
    }
}



/* funzione per MISCHIARE l'array degli enunciati, utilizzo il `Fisher-Yates` */
function shuffle(array) {
  let currentIndex = array.length;

  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array; 
}



/* funzione per le RISPOSTE MULTIPLE (da capire un pochino meglio questa però mi raccomando)*/
function generateMultipleChoiceOptions(currQuestion, allTheorems) {
  const correctAnswer = currQuestion[0];
  const wrongAnswers = allTheorems.filter((teorema) => teorema[0] !== correctAnswer).map((teorema) => teorema[0]);

  shuffle(wrongAnswers);

  const options = [correctAnswer, ...wrongAnswers.slice(0, 3)];
  return shuffle(options);
}



/* Funzione per mostrare l'intero ENUNCIATO E le OPZIONI dentro ai bottoni  */ 
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

  const enunciato = fixLatexEnvironments(currentQuestion[1]); 
  if (questionHeader) questionHeader.innerHTML = enunciato;

  const options = generateMultipleChoiceOptions(currentQuestion, enunciati);

  answerButtons.forEach((button, index) => {
    const optionText = button.querySelector('.option-text');
    const optionValue = options[index] ?? '';
    if (optionText) {
      optionText.textContent = `${String.fromCharCode(65 + index)}) ${optionValue}`;
    }
    if (button) {
      button.dataset.isCorrect = optionValue === currentQuestion[0] ? 'true' : 'false';
      button.dataset.optionValue = optionValue; // Aggiung il valore dell'opzione per debug
    }
  });

  console.log('Domanda renderizzata, opzioni impostate correttamente');

  /* serve per renderizzare le formule matematiche */
  const questionBox = document.querySelector('.container-question_box');
  if (questionBox && window.MathJax) {
    MathJax.typesetClear([questionBox]); 
    MathJax.typesetPromise([questionBox]).catch(err => console.error('MathJax error:', err));
  }
}



function initQuiz() {
  if (enunciati.length === 0) {
    console.error('Nessun teorema disponibile');
    return;
  }

  console.log('Inizializzazione quiz con ' + enunciati.length + ' teoremi');

  // Pulizia COMPLETA dello stato iniziale
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
  console.log('Prima domanda indice:', currTheoremIndex);
  
  renderQuestion_and_options(currTheoremIndex);

  // Attacca gli event listener
  attachAnswerListeners();
  attachNextButtonListener();
  
  console.log('Quiz inizializzato correttamente');
}

function attachAnswerListeners() {
  const answerContainer = document.querySelector('.answer_options');
  
  if (!answerContainer) {
    console.error('Container .answer_options non trovato!');
    return;
  }

  /* rimuovo il vecchio listener */
  answerContainer.removeEventListener('click', handleAnswerSelectionDelegated);
  
  /* attacco il nuovo listener */
  answerContainer.addEventListener('click', handleAnswerSelectionDelegated);
  
  console.log('Event listener per risposta riattaccato, numero bottoni:', document.querySelectorAll('.answer-btn').length);
}


function attachNextButtonListener() {
  const nextButton = document.querySelector('.next-btn');
  if (!nextButton) {
    console.error('Bottone .next-btn non trovato!');
    return;
  }

  nextButton.removeEventListener('click', handleNextQuestion);  
  nextButton.addEventListener('click', handleNextQuestion);
  
  console.log('Event listener per "Domanda Successiva" riattaccato');
}


/* funzione per cliccare una sola risposta con Event Delegation */
function handleAnswerSelectionDelegated(event) {
  const button = event.target.closest('.answer-btn');
  if (!button) {
    console.warn('Nessun bottone trovato dal target del click');
    return;
  }

    /* controlliamo se il bottone ha il dataset isCorrect */  
    if (!button.hasAttribute('data-is-correct')) {
    console.error('Bottone non ha attributo data-is-correct!', button);
    return;
  }

  const allButtons = document.querySelectorAll('.answer-btn');
  allButtons.forEach(btn => btn.classList.remove('selected'));
  
  button.classList.add('selected');
  selectedAnswer = button;
  
  console.log('Bottone selezionato:', button.dataset.isCorrect, 'Valore:', button.dataset.optionValue, 'Classe selected presente:', document.querySelector('.answer-btn.selected') !== null);
}

/* Quando clicchi "Domanda Successiva", valuta la risposta e avanza */
function handleNextQuestion() {
  if (!selectedAnswer) {
    console.warn('selectedAnswer è null, cerco il bottone tramite classe');
  }


  let selectedButton = document.querySelector('.answer-btn.selected');
  
  if (!selectedButton && selectedAnswer) {
    selectedButton = selectedAnswer;
    console.warn('selectedButton non trovato via querySelector, usando selectedAnswer');
  }


  if (!selectedButton) {
    console.error('Nessun bottone selezionato! selectedAnswer:', selectedAnswer);
    alert('Seleziona una risposta prima di continuare!');
    return;
  }

  if (!selectedButton.hasAttribute('data-is-correct')) {
    console.error('Bottone selezionato non ha dataset isCorrect!', selectedButton);
    alert('Errore: risposta non configurata correttamente. Ricaricare la pagina.');
    return;
  }

  /* Controlliamo se la risposta è corretta */
  const isCorrect = selectedButton.dataset.isCorrect === 'true';
  console.log('Risposta valutata:', {
    selezionata: selectedButton.dataset.optionValue,
    corretta: isCorrect,
    datasetValue: selectedButton.dataset.isCorrect
  });
  
  if (isCorrect) {
    correctAnswers++;
    updateProgressBar();
  }

  questionsAnswered++;
  
  /* Carico la prossima domanda */
  if (enunciati.length > 0) {
    // Pulizia COMPLETA dello stato
    selectedAnswer = null;
    
    /* rimuoviamo la classe 'selected' da tutti i bottoni */
    const allButtons = document.querySelectorAll('.answer-btn');
    allButtons.forEach(btn => btn.classList.remove('selected'));
    
    /* seleziono la prossima domanda in maniera casuale */
    currTheoremIndex = Math.floor(Math.random() * enunciati.length);
    
    console.log('Caricamento domanda ' + (questionsAnswered + 1) + ' di ' + enunciati.length);
    
    /* reinderizzo la prossima domanda */
    renderQuestion_and_options(currTheoremIndex);
    updateQuestionNumber();
    
    /* riattacco gli event listener (importante dopo il DOM update) */
    attachAnswerListeners();
  }
}




/* Il problema di MathJax è che renderizza solamente le formule matematiche, mentre ambienti come enumerate, itemize e altri sono ambienti testuali che MathJax non gestisce, per questo motivo bisogna fare una correzione manuale e convertire questi ambienti in codice html prima di passarli a MathJax */
function fixLatexEnvironments(text) {
  /* enumerate -> <ol> */
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

  /* itemize -> <ul> */
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

function preprocessLatex(text) {
  text = fixLatexEnvironments(text);
  return text;
}



/* logica da implementare per la gestione delle risposte ed il conteggio punteggio*/ 
/* variabili per tracciare lo stato del quiz */
let selectedAnswer = null;  /* traccio quale bottone è stato selezionato */
let correctAnswers = 0;     /* numero di risposte corrette */
let questionsAnswered = 0;  /* numero di domande risposte */


/* upgradiamo la nostra barra di avanzamento */ 
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






