// Elementos del menú y otros botones
const menuButton = document.getElementById('menuButton');
const menu = document.getElementById('menu');
const closeMenuButton = document.getElementById('closeMenuButton');
const resizeButton = document.getElementById('resizeButton');
const homeButton = document.getElementById('homeButton');
const diagnosticoModal = document.getElementById('diagnosticoModal');
const startDiagnostic = document.getElementById('startDiagnostic');
const diagnosticoTab = document.getElementById('diagnostico');

// Funcionalidad del botón de menú
menuButton.addEventListener('click', () => {
  menu.classList.add('open');
});

// Funcionalidad del botón de cierre del menú
closeMenuButton.addEventListener('click', () => {
  menu.classList.remove('open');
});

// Funcionalidad del botón de pantalla completa
resizeButton.addEventListener('click', () => {
  if (resizeButton.querySelector('i').classList.contains('fa-expand')) {
    document.body.requestFullscreen();
    resizeButton.querySelector('i').classList.replace('fa-expand', 'fa-compress');
  } else {
    document.exitFullscreen();
    resizeButton.querySelector('i').classList.replace('fa-compress', 'fa-expand');
  }
});

// Funcionalidad del botón de inicio
homeButton.addEventListener('click', () => {
  window.location.href = '../../index.html';
});

// Función para mostrar un tab específico
function showTab(tabId) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('button').forEach(button => button.classList.remove('active-tab'));
  document.getElementById(tabId).classList.remove('hidden');
  document.getElementById(`tab-${tabId}`).classList.add('active-tab');
  menu.classList.remove('open');
}

// Función para mostrar el modal del diagnóstico y empezar
startDiagnostic.addEventListener('click', () => {
  diagnosticoModal.classList.add('hidden');
  diagnosticoTab.classList.remove('hidden');
});

// Función para obtener una clave única por fecha
function getUniqueKey(baseKey) {
  const currentDate = new Date();
  const dateString = currentDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  return `${baseKey}_${dateString}`;
}

// Función para guardar en LocalStorage
function saveToLocalStorage(key, value) {
  const uniqueKey = getUniqueKey(key); // Usamos la clave única
  localStorage.setItem(uniqueKey, JSON.stringify(value));
}

// Función para cargar desde LocalStorage
function loadFromLocalStorage(key) {
  const uniqueKey = getUniqueKey(key); // Usamos la clave única
  const value = localStorage.getItem(uniqueKey);
  return value ? JSON.parse(value) : null;
}

// Función para almacenar las respuestas de cada pregunta con fecha única
function saveAnswer(questionId, selectedAnswer) {
  const examKey = "exam_responses"; // Usa esta clave para cada examen
  const uniqueKey = getUniqueKey(examKey);  // Genera una clave única por fecha
  const responses = loadFromLocalStorage(examKey) || {};
  responses[questionId] = selectedAnswer;
  saveToLocalStorage(examKey, responses);
}

// Función para cargar las respuestas de un examen desde LocalStorage
function loadAnswers() {
  const examKey = "exam_responses"; // Usa esta clave para cada examen
  return loadFromLocalStorage(examKey) || {};
}

// Función para verificar si el examen está resuelto
function isExamCompleted() {
  // Cargar las respuestas
  const responses = loadAnswers();  // exam_responses_(fecha)

  // Cargar el array con el orden de preguntas
  const order = loadFromLocalStorage('exam_order') || [];

  // OPCIÓN A: Comparar solo longitudes
  // (Suponiendo que no hay IDs extras en 'responses')
  const sameLength = order.length === Object.keys(responses).length;

  // OPCIÓN B: Verificar además que cada questionId de 'order' exista en 'responses'
  const allAnswered = order.every(questionId => questionId in responses);

  // Puedes usar la combinación de ambos enfoques:
  return sameLength && allAnswered;
}

// Función para verificar si el examen está completo
function toggleDiagnosticModal(initial = false) {
  const examCompleted = isExamCompleted();

  if (initial) {
    if (loadFromLocalStorage('exam_completed') === null) {
      diagnosticoModal.classList.remove('hidden');
      saveToLocalStorage('exam_completed', false);
    } else {
      restoreDiagnosticModalState();
    }
  } else if (examCompleted) {
    diagnosticoModal.classList.add('hidden');
    saveToLocalStorage('exam_completed', true);
    stopTimerWithBlink(); // Detener el temporizador y parpadear
  }
}

// Actualizamos la función de selección de respuestas para verificar el estado del examen
function selectAnswer(element) {
  const questionId = element.parentNode.id;
  const allAnswers = element.parentNode.querySelectorAll('.answer');

  // Deshabilitar interacciones
  allAnswers.forEach(answer => (answer.style.pointerEvents = 'none'));

  // Determinar si la respuesta es correcta
  const isCorrect = element.getAttribute('data-correct') === 'true';
  const selectedAnswerIndex = Array.from(allAnswers).indexOf(element);
  const correctAnswer = element.parentNode.querySelector('[data-correct="true"]');

  if (isCorrect) {
    element.classList.add('border-green-500');
  } else {
    element.classList.add('border-red-500');
    correctAnswer.classList.add('border-green-500');
  }

  // Guardar la respuesta seleccionada en LocalStorage
  saveAnswer(questionId, { selected: selectedAnswerIndex, correctIndex: Array.from(allAnswers).indexOf(correctAnswer) });

  // Verificar si el examen está completo después de responder
  toggleDiagnosticModal();
}

// Función para restaurar el modal según el estado del examen
function restoreDiagnosticModalState() {
  const examCompleted = loadFromLocalStorage('exam_completed');
  if (examCompleted) {
    diagnosticoModal.classList.add('hidden');
  } else {
    diagnosticoModal.classList.remove('hidden');
  }
}

// Función para aleatorizar las preguntas y guardar el orden
function randomizeQuestions() {
  // Recuperar sólo aquellos .question que sí tienen un ID
  const questions = Array.from(document.querySelectorAll('.question'))
    .filter(q => q.id && q.id.trim().length > 0); // filtrar los vacíos

  // Cargar el orden desde localStorage o aleatorizar si no existe
  let order = loadFromLocalStorage('exam_order');
  if (!order) {
    order = questions
      .map(question => question.id)
      .sort(() => Math.random() - 0.5);
    saveToLocalStorage('exam_order', order);
  }

  // Ordenar las preguntas según el orden guardado
  const diagnosticoTab = document.getElementById('diagnostico');
  order.forEach((questionId, index) => {
    const question = document.getElementById(questionId);

    if (question) {
      diagnosticoTab.appendChild(question);
      const title = question.querySelector('.question-title');
      if (title) {
        title.textContent = `Problema ${index + 1}:`;
      }
    } else {
      console.warn(`Elemento con id "${questionId}" no encontrado en el DOM.`);
    }
  });
}

// Función para restaurar respuestas seleccionadas
function restoreAnswers() {
  const responses = loadAnswers();
  Object.keys(responses).forEach(questionId => {
    const questionElement = document.getElementById(questionId);
    const answers = questionElement.querySelectorAll('.answer');
    const response = responses[questionId];

    if (response) {
      const selectedAnswer = answers[response.selected];
      const correctAnswer = answers[response.correctIndex];

      // Restaurar estilos de selección
      answers.forEach(answer => (answer.style.pointerEvents = 'none'));
      if (response.selected === response.correctIndex) {
        selectedAnswer.classList.add('border-green-500');
      } else {
        selectedAnswer.classList.add('border-red-500');
        correctAnswer.classList.add('border-green-500');
      }
    }
  });
}

let timerInterval; // Intervalo para el temporizador
let timeLeft = 14 * 60 + 59; // Tiempo inicial en segundos

// Función para iniciar el contador
function startTimer() {
  const timerDisplay = document.getElementById('timerDisplay');
  const countdown = document.getElementById('countdown');

  timerInterval = setInterval(() => {
    // Convertir segundos a formato mm:ss
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    // Actualizar texto del temporizador
    timerDisplay.textContent = formattedTime;
    countdown.textContent = formattedTime;

    // Verificar si el examen está completo
    if (isExamCompleted()) {
      clearInterval(timerInterval); // Detener el contador
      timerDisplay.classList.add('blink'); // Añadir parpadeo
      countdown.classList.add('blink');
      return;
    }

    // Si el tiempo se agota
    if (timeLeft === 0) {
      clearInterval(timerInterval); // Detener el contador
      timerDisplay.classList.replace('text-green-700', 'text-red-700');
      countdown.classList.replace('text-green-700', 'text-red-700');
      disableAnswers(); // Deshabilitar respuestas
    }

    timeLeft--;
  }, 1000);
}

// Añadir la clase de parpadeo cuando el examen se completa
function stopTimerWithBlink() {
  clearInterval(timerInterval);
  const timerDisplay = document.getElementById('timerDisplay');
  const countdown = document.getElementById('countdown');
  timerDisplay.classList.add('blink');
  countdown.classList.add('blink');
}

// Función para deshabilitar respuestas
function disableAnswers() {
  const answers = document.querySelectorAll('.answer');
  answers.forEach(answer => {
    answer.style.pointerEvents = 'none';
  });
}

// Modificar el evento de inicio para iniciar el contador
startDiagnostic.addEventListener('click', () => {
  diagnosticoModal.classList.add('hidden');
  diagnosticoTab.classList.remove('hidden');
  startTimer(); // Iniciar el temporizador al comenzar el diagnóstico
});






















let currentQuestion = 0;
const questions = [
  {
    text: "Knowledge is a powerful tool that enables individuals to unlock opportunities and achieve their full potential.",
    questionSK: "What is the central theme of this text?",
    alternativesSK: ["a) Knowledge is irrelevant.", "b) Knowledge empowers and opens opportunities.", "c) Knowledge hinders growth.", "d) Knowledge is limited."],
    questionSC: "What does knowledge enable according to the text?",
    alternativesSC: ["a) Unlocking opportunities.", "b) Limiting potential.", "c) Creating challenges.", "d) Hindering success."],
    correctAnswerSK: 1,
    correctAnswerSC: 0,
    hintRed: "to",
    hintBlue: "throughout"
  },
  {
    text: "Education is not just about acquiring facts; it’s about developing critical thinking and problem-solving skills.",
    questionSK: "What is the primary idea of this passage?",
    alternativesSK: ["a) Education has no purpose.", "b) Education is only for children.", "c) Education develops important skills.", "d) Education is solely about facts."],
    questionSC: "What does education help to develop?",
    alternativesSC: ["a) Critical thinking and problem-solving.", "b) Memory skills.", "c) Physical strength.", "d) Artistic abilities."],
    correctAnswerSK: 2,
    correctAnswerSC: 0,
    hintRed: "minds",
    hintBlue: "opens"
  },
  {
    text: "Lifelong learning encourages individuals to adapt to changes and stay relevant in a fast-paced world.",
    questionSK: "What does lifelong learning promote?",
    alternativesSK: ["a) Isolation.", "b) Resistance to change.", "c) Adaptability and relevance.", "d) Stagnation."],
    questionSC: "What does lifelong learning help individuals achieve?",
    alternativesSC: ["a) Relevance in a changing world.", "b) Stagnation.", "c) Resistance to growth.", "d) Limitation of knowledge."],
    correctAnswerSK: 2,
    correctAnswerSC: 0,
    hintRed: "Education",
    hintBlue: "Knowledge"
  },
  {
    text: "Continuous education broadens perspectives and fosters innovation by introducing new ideas.",
    questionSK: "What is the main benefit of continuous education?",
    alternativesSK: ["a) Promoting outdated ideas.", "b) Broadening perspectives and fostering innovation.", "c) Creating barriers.", "d) Limiting creativity."],
    questionSC: "What does continuous education introduce?",
    alternativesSC: ["a) New ideas.", "b) Old concepts.", "c) Restrictions.", "d) Unnecessary details."],
    correctAnswerSK: 1,
    correctAnswerSC: 2,
    hintRed: "empowers",
    hintBlue: "doors"
  },
  {
    text: "Learning from mistakes is essential for personal and professional growth.",
    questionSK: "What is emphasized as crucial for growth?",
    alternativesSK: ["a) Avoiding mistakes.", "b) Ignoring errors.", "c) Learning from mistakes.", "d) Perfection."],
    questionSC: "According to the text, what is essential for growth?",
    alternativesSC: ["a) Learning from mistakes.", "b) Avoiding risks.", "c) Ignoring challenges.", "d) Pursuing perfection."],
    correctAnswerSK: 2,
    correctAnswerSC: 3,
    hintRed: "achieve",
    hintBlue: "fosters"
  },
  {
    text: "Collaborative learning enhances understanding by allowing individuals to share and compare ideas.",
    questionSK: "What is the benefit of collaborative learning?",
    alternativesSK: ["a) Creating confusion.", "b) Enhancing understanding through idea sharing.", "c) Hindering communication.", "d) Discouraging teamwork."],
    questionSC: "How does collaborative learning improve understanding?",
    alternativesSC: ["a) By sharing and comparing ideas.", "b) By working alone.", "c) By ignoring feedback.", "d) By repeating the same ideas."],
    correctAnswerSK: 1,
    correctAnswerSC: 2,
    hintRed: "and",
    hintBlue: "growth"
  },
  {
    text: "A growth mindset focuses on embracing challenges as opportunities to learn and improve.",
    questionSK: "What is the key aspect of a growth mindset?",
    alternativesSK: ["a) Believing in fixed abilities.", "b) Embracing challenges to learn and improve.", "c) Avoiding difficulties.", "d) Resisting change."],
    questionSC: "What does a growth mindset encourage individuals to do?",
    alternativesSC: ["a) Embrace challenges.", "b) Avoid learning.", "c) Reject opportunities.", "d) Stay passive."],
    correctAnswerSK: 1,
    correctAnswerSC: 1,
    hintRed: "inspires",
    hintBlue: "and"
  },
  {
    text: "Learning should be seen as a journey, not a destination, with each step bringing new insights and understanding.",
    questionSK: "What metaphor does the text use for learning?",
    alternativesSK: ["a) A destination.", "b) A journey.", "c) A competition.", "d) A barrier."],
    questionSC: "How should learning be perceived according to the text?",
    alternativesSC: ["a) As a journey.", "b) As a destination.", "c) As a race.", "d) As a challenge."],
    correctAnswerSK: 1,
    correctAnswerSC: 3,
    hintRed: "change",
    hintBlue: "life"
  }
];

let hints = [];
let isAnsweringFinal = false;

function setColor() {
  let color = localStorage.getItem('colorSquare');
  
  if (!color) {
    color = Math.random() > 0.5 ? 'red' : 'blue';
    localStorage.setItem('colorSquare', color);
  }

  const colorSquare = document.getElementById('colorSquare');
  if (color === 'red') {
    colorSquare.classList.add('bg-red-700');
    colorSquare.textContent = 'Scanning';
  } else {
    colorSquare.classList.add('bg-blue-700');
    colorSquare.textContent = 'Skimming';
  }

  loadQuestion();
}

function loadQuestion() {
  const color = localStorage.getItem('colorSquare');
  const questionContainer = document.getElementById('questionContainer');
  const hintContainer = document.getElementById('hintContainer');
  const hintText = document.getElementById('hintText');
  const question = questions[currentQuestion];
  const answerInput = document.getElementById('answerInput');
  
  let questionText = '';
  let alternatives = [];
  let buttonColor = 'bg-green-700'; // Default color for the button
  let questionColor = 'text-black'; // Default question color
  let hintColor = 'text-black'; // Default hint color
  let inputColor = 'text-black'; // Default input color
  
  if (color === 'red') {
    questionText = question.questionSC;
    alternatives = question.alternativesSC;
    buttonColor = 'bg-red-700'; // Red team button color
    questionColor = 'text-red-700'; // Red team question and title color
    hintColor = 'text-red-700'; // Red team hint color
    inputColor = 'text-red-700'; // Red team input color
  } else {
    questionText = question.questionSK;
    alternatives = question.alternativesSK;
    buttonColor = 'bg-blue-700'; // Blue team button color
    questionColor = 'text-blue-700'; // Blue team question and title color
    hintColor = 'text-blue-700'; // Blue team hint color
    inputColor = 'text-blue-700'; // Blue team input color
  }

  questionContainer.innerHTML = `
    <div class="question mb-6">
      <p class="text-2xl font-semibold ${questionColor}" data-order="${currentQuestion + 1}">Fase ${currentQuestion + 1}</p>
      <p class="mb-4 text-black">${question.text}</p>
      <p class="mb-4 font-bold text-lg ${questionColor}">${questionText}</p>
      ${alternatives.map((alt, index) => `
        <div class="answer border-2 p-3 mb-2 capitalize text-black" data-correct="${index === (color === 'red' ? question.correctAnswerSC : question.correctAnswerSK)}" onclick="processAnswerSelection(this, ${index})">
          ${alt}
        </div>
      `).join('')}
    </div>
  `;

  // Cambiar el color del botón de acuerdo al equipo
  const submitButton = document.getElementById('submitAnswer');
  submitButton.classList.remove('bg-green-700', 'bg-red-700', 'bg-blue-700'); // Eliminar colores anteriores
  submitButton.classList.add(buttonColor); // Añadir el color adecuado

  // Cambiar el color del hint
  hintText.classList.add(hintColor); // Establecer el color del hint
  hintContainer.classList.add(hintColor); // Asegurar que el contenedor del hint tenga el color

  // Cambiar el color del input
  answerInput.classList.add(inputColor); // Establecer el color del texto en el input
}

function processAnswerSelection(element, index) {
  const answers = document.querySelectorAll('.answer');
  answers.forEach(answer => {
    answer.removeAttribute('onclick');
    answer.classList.add('cursor-not-allowed');
  });

  const correct = element.dataset.correct === 'true';
  // 1. Obtener la pista de la pregunta actual
  const questionHint = localStorage.getItem('colorSquare') === 'red'
    ? questions[currentQuestion].hintRed
    : questions[currentQuestion].hintBlue;
  
  // 2. Guardar SIEMPRE la pista (independientemente de si la respuesta fue correcta)
  hints.push(questionHint);

  if (correct) {
    element.classList.add('border-green-500');
    showHint(); // Muestra la pista si quieres en ese momento
  } else {
    element.classList.add('border-red-500');
    document.getElementById('hintContainer').classList.add('hidden');
  }
}

function showHint() {
  const hintContainer = document.getElementById('hintContainer');
  const hintText = document.getElementById('hintText');
  hintText.textContent = localStorage.getItem('colorSquare') === 'red' ? questions[currentQuestion].hintRed : questions[currentQuestion].hintBlue;
  hintContainer.classList.remove('hidden');
}

function checkAnswer() {
  const input = document.getElementById('answerInput');
  const userAnswer = input.value.trim();

  // Se obtiene el hint de la pregunta actual según el color
  const currentHint = localStorage.getItem('colorSquare') === 'red'
    ? questions[currentQuestion].hintRed
    : questions[currentQuestion].hintBlue;

  // Si el usuario ingresa exactamente el hint correspondiente, avanza
  if (userAnswer === currentHint) {
    currentQuestion++;
    if (currentQuestion < questions.length) {
      loadQuestion();
    } else {
      showFinalPhase();
    }
    // Limpiar el input y ocultar la pista
    input.value = '';
    document.getElementById('hintContainer').classList.add('hidden');
  }
}

function showFinalPhase() {
  const color = localStorage.getItem('colorSquare');
  const questionSection = document.getElementById('questionSection');
  const answerInput = document.getElementById('answerInput');
  const submitAnswer = document.getElementById('submitAnswer');
  
  // Ocultar las fases anteriores
  questionSection.classList.add('hidden');
  answerInput.classList.add('hidden');
  submitAnswer.classList.add('hidden');

  // Configurar fase final
  const finalPhase = document.getElementById('finalPhase');
  const finalTitle = finalPhase.querySelector('.question-title');
  const finalButton = document.getElementById('finalSubmit');
  const allHints = document.getElementById('allHints');
  
  // Configurar el color de la fase final según el equipo
  if (color === 'red') {
    finalTitle.classList.add('text-red-700');
    finalButton.classList.add('bg-red-700');
  } else {
    finalTitle.classList.add('text-blue-700');
    finalButton.classList.add('bg-blue-700');
  }
  
  // Mostrar todas las pistas en negro
  allHints.innerHTML = hints.map(hint => `<p class="text-lg text-black">${hint}</p>`).join('');
  
  finalPhase.classList.remove('hidden');
}

function completeFinalPhase() {
  const color = localStorage.getItem('colorSquare');
  const finalPhase = document.getElementById('finalPhase');
  const finalButton = document.getElementById('finalSubmit');
  const finalTitle = finalPhase.querySelector('.question-title');

  // Obtener la respuesta del usuario
  const correctAnswer = color === 'red' ? 'red' : 'blue'; // Respuesta final según el equipo
  const userAnswer = document.getElementById('finalAnswer').value;

  // Si la respuesta es correcta
  if (userAnswer === correctAnswer) {
    // Eliminar clases de color anteriores (rojo o azul)
    finalTitle.classList.remove('text-red-700', 'text-blue-700');
    finalButton.classList.remove('bg-red-700', 'bg-blue-700');
    finalPhase.classList.remove('bg-red-700', 'bg-blue-700'); // Eliminar cualquier fondo anterior
    
    // Cambiar todo a green-700 (título y botón)
    finalTitle.classList.add('text-green-700');
    finalButton.classList.add('bg-green-700');
    finalPhase.classList.add('bg-green-700'); // Cambiar el fondo
  }
}

function checkFinalAnswer() {
  const finalAnswer = document.getElementById('finalAnswer').value.trim();
  const color = localStorage.getItem('colorSquare');
  const correctAnswer = color === 'red' ? 'Education inspires change and empowers minds to achieve' : 'Knowledge opens doors and fosters growth throughout life'; // Respuestas finales distintas según el equipo

  const colorSquare = document.getElementById('colorSquare');
  
  if (finalAnswer === correctAnswer) {
    // Cambiar color del cuadrado a verde cuando la respuesta es correcta
    colorSquare.classList.remove('bg-red-700', 'bg-blue-700');
    colorSquare.classList.add('bg-green-700');
    colorSquare.textContent = '¡Felicitaciones!';
  }
}

// Función para inicializar la página
window.onload = () => {
  setColor(); // Establecer el color y el texto según localStorage
  toggleDiagnosticModal(true); // Mostrar el modal al inicio
  randomizeQuestions(); // Aleatorizar preguntas o restaurar el orden
  restoreAnswers(); // Restaurar respuestas seleccionadas
};

document.getElementById('submitAnswer').onclick = checkAnswer;
document.getElementById('finalSubmit').onclick = checkFinalAnswer;










































// Datos de ejemplo para las preguntas
const questionsData = {
  slider1: [
    {
      difficulty: "easy",
      context: "In a study on consumption patterns, how people interact with digital offerings has been analyzed, considering various current market factors.",
      question: "What is the main observed trend?",
      image: "",
      options: [
        "Increase in digital consumption",
        "Decrease in spending",
        "Higher savings",
        "Stable consumption"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "medium-low",
      context: "A study analyzing market behavior reveals that consumers tend to prioritize elements like pricing, perceived quality, and brand reputation when deciding on purchases.",
      question: "What factor influences the buying decision the most?",
      options: [
        "Product price",
        "Perceived quality",
        "Product brand",
        "Recommendations"
      ],
      correctAnswer: 1
    },
    {
      difficulty: "medium-high",
      context: "Considering the substantial changes in the global labor market, it's critical to assess how these shifts are influencing overall productivity, unemployment rates, and economic stability in various sectors.",
      question: "What impact does it have on the economy?",
      options: [
        "Lower productivity",
        "Higher unemployment",
        "Economic growth",
        "Labor stability"
      ],
      correctAnswer: 2
    },
    {
      difficulty: "hard",
      context: "Amid an ongoing economic downturn, different measures are under scrutiny to assess their effectiveness in stimulating the economy, from tightening monetary policy to enhancing export activity and trade relations.",
      question: "What is the most effective measure?",
      options: [
        "Increase interest rates",
        "Reduce public spending",
        "Implement subsidies",
        "Stimulate exports"
      ],
      correctAnswer: 3
    }
  ],
  slider2: [
    {
      difficulty: "easy",
      context: "Considering climate change, the most effective solutions include the implementation of renewable energies, which help reduce pollutant emissions and mitigate global warming.",
      question: "What is the most effective solution?",
      options: [
        "Renewable energy",
        "Emission reduction",
        "Recycling",
        "Responsible consumption"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "medium-low",
      context: "In the sustainability sector, several strategies are considered viable for promoting a shift towards more responsible practices, with economic incentives being a significant motivator for businesses and consumers alike.",
      question: "What strategy is most viable?",
      options: [
        "Environmental education",
        "Strict legislation",
        "Economic incentives",
        "Technological innovation"
      ],
      correctAnswer: 2
    },
    {
      difficulty: "medium-high",
      context: "Within the realm of technological innovation, significant emphasis is placed on the importance of research and development (R&D) investments. These investments not only drive technological breakthroughs but also serve as a crucial component in fostering long-term global competitiveness.",
      question: "What factor is most relevant?",
      options: [
        "Investment in R&D",
        "Human capital",
        "Infrastructure",
        "Regulatory framework"
      ],
      correctAnswer: 1
    },
    {
      difficulty: "hard",
      context: "Amid the pressing challenges faced on a global scale, securing access to adequate food supplies has emerged as a critical priority. This issue is of paramount importance, particularly in regions suffering from widespread poverty and inequities in access to essential resources.",
      question: "What is the most urgent priority?",
      options: [
        "Food security",
        "Climate change",
        "Social inequality",
        "Technological development"
      ],
      correctAnswer: 0
    }
  ],
  slider3: [
    {
      difficulty: "easy",
      context: "Global economic trends show a rapid increase in digital spending, especially in sectors such as retail, entertainment, and services.",
      question: "What is the most significant trend?",
      options: [
        "Digital spending rise",
        "Decrease in spending",
        "Shift to savings",
        "Stable consumption"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "medium-low",
      context: "In consumer behavior analysis, it's been found that pricing, quality, and brand play a major role in influencing the purchasing choices of individuals.",
      question: "Which factor plays a major role in the purchase decision?",
      options: [
        "Product price",
        "Perceived quality",
        "Brand",
        "Consumer reviews"
      ],
      correctAnswer: 1
    },
    {
      difficulty: "medium-high",
      context: "As shifts in the labor market become more pronounced, their effects on employment, wages, and the broader economy become even more critical to understand and address in policy-making.",
      question: "What effect does this have on the economy?",
      options: [
        "Lower productivity",
        "Higher unemployment",
        "Economic growth",
        "Labor stability"
      ],
      correctAnswer: 2
    },
    {
      difficulty: "hard",
      context: "Amid global financial instability, governments are looking into diverse strategies for stimulating growth, including monetary tightening, fiscal austerity, and fostering export growth to stabilize their economies.",
      question: "Which measure is the most effective?",
      options: [
        "Increase interest rates",
        "Reduce public spending",
        "Implement subsidies",
        "Encourage exports"
      ],
      correctAnswer: 3
    }
  ],
  slider4: [
    {
      difficulty: "easy",
      context: "The adoption of green technologies, such as solar and wind energy, is a critical component in the battle against climate change and reducing carbon emissions.",
      question: "What is the best solution?",
      options: [
        "Renewable energy",
        "Emission reductions",
        "Recycling",
        "Efficient consumption"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "medium-low",
      context: "In sustainability efforts, economic incentives like tax breaks or grants are seen as effective tools for motivating both individuals and companies to engage in environmentally friendly practices.",
      question: "What is the most effective strategy?",
      options: [
        "Environmental education",
        "Strict legislation",
        "Economic incentives",
        "Innovation"
      ],
      correctAnswer: 2
    },
    {
      difficulty: "medium-high",
      context: "Technological progress heavily depends on research and development, and the infusion of capital into this sector accelerates innovation and enhances the technological capabilities of nations and industries.",
      question: "What factor matters the most?",
      options: [
        "Investment in R&D",
        "Human resources",
        "Infrastructure",
        "Legal framework"
      ],
      correctAnswer: 1
    },
    {
      difficulty: "hard",
      context: "Given the multifaceted nature of global crises, addressing food insecurity stands out as a foremost challenge, particularly in impoverished regions where access to essential resources is severely limited.",
      question: "What is the most critical priority?",
      options: [
        "Food security",
        "Climate change",
        "Social disparity",
        "Technological advancement"
      ],
      correctAnswer: 0
    }
  ],
  slider5: [
    {
      difficulty: "easy",
      context: "The digital landscape has shifted rapidly, with more people spending on digital platforms for entertainment, shopping, and services.",
      question: "What is the biggest trend?",
      options: [
        "Rise in digital consumption",
        "Drop in spending",
        "Increased savings",
        "Stable consumption"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "medium-low",
      context: "Consumers generally tend to focus on price, perceived quality, and the reputation of the brand when making purchasing decisions.",
      question: "What factor has the biggest impact on purchasing decisions?",
      options: [
        "Price",
        "Quality",
        "Brand",
        "Recommendations"
      ],
      correctAnswer: 1
    },
    {
      difficulty: "medium-high",
      context: "Shifts in the labor market are having far-reaching effects on productivity and unemployment, requiring a comprehensive understanding to form effective policy responses.",
      question: "What impact does this have on the economy?",
      options: [
        "Decreased productivity",
        "Increased unemployment",
        "Economic growth",
        "Labor stability"
      ],
      correctAnswer: 2
    },
    {
      difficulty: "hard",
      context: "In an economic downturn, policy measures such as increasing interest rates, reducing government spending, and fostering export growth are considered essential tools for recovery.",
      question: "What is the most effective approach?",
      options: [
        "Raise interest rates",
        "Reduce public expenditure",
        "Subsidies",
        "Boost exports"
      ],
      correctAnswer: 3
    }
  ],
  slider6: [
    {
      difficulty: "easy",
      context: "Renewable energy is seen as the cornerstone of mitigating climate change by reducing carbon emissions and fostering environmental sustainability.",
      question: "What is the key solution?",
      options: [
        "Renewable energy",
        "Reducing emissions",
        "Recycling",
        "Sustainable consumption"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "medium-low",
      context: "To achieve long-term sustainability, it is essential to incentivize eco-friendly practices through policies and economic incentives that encourage widespread adoption.",
      question: "What strategy is most effective?",
      options: [
        "Environmental education",
        "Tougher legislation",
        "Economic incentives",
        "Tech innovation"
      ],
      correctAnswer: 2
    },
    {
      difficulty: "medium-high",
      context: "R&D investments continue to be central to driving technological innovation and improving competitiveness. These investments enable the development of cutting-edge technologies that shape the future of industries worldwide.",
      question: "Which factor is key?",
      options: [
        "Investment in R&D",
        "Human capital",
        "Infrastructure",
        "Legal framework"
      ],
      correctAnswer: 1
    },
    {
      difficulty: "hard",
      context: "As global challenges multiply, food security is becoming increasingly urgent, particularly in regions suffering from poverty, inequality, and limited access to essential resources.",
      question: "What is the most urgent issue?",
      options: [
        "Food security",
        "Climate change",
        "Social inequality",
        "Technological progress"
      ],
      correctAnswer: 0
    }
  ],
  slider7: [
    {
      difficulty: "easy",
      context: "The impact of globalization is most noticeable in the retail sector, where multinational companies dominate local markets.",
      question: "What is the main impact of globalization?",
      options: [
        "Increase in multinational companies",
        "Decline in local businesses",
        "Higher product prices",
        "Reduced consumer choices"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "medium-low",
      context: "In the era of social media, influencers have become a powerful force in shaping consumer preferences and trends.",
      question: "Who influences consumer behavior the most?",
      options: [
        "Social media influencers",
        "Traditional advertising",
        "Friends and family",
        "Store displays"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "medium-high",
      context: "Corporate social responsibility is a growing trend among businesses that aim to improve their public image by contributing to social causes.",
      question: "What is the main purpose of corporate social responsibility?",
      options: [
        "Improving public image",
        "Increasing profits",
        "Expanding market reach",
        "Reducing operational costs"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "hard",
      context: "The environmental impact of the fashion industry is significant, with large amounts of waste and pollution produced by fast fashion and textile manufacturing.",
      question: "What is the primary environmental concern in the fashion industry?",
      options: [
        "Waste and pollution",
        "Overproduction of clothing",
        "Use of non-renewable resources",
        "Water consumption"
      ],
      correctAnswer: 0
    }
  ],
  slider8: [
    {
      difficulty: "easy",
      context: "Electric vehicles are gaining popularity as a cleaner and more sustainable alternative to traditional gasoline-powered cars.",
      question: "What is the main benefit of electric vehicles?",
      options: [
        "Lower emissions",
        "Higher speed",
        "Cheaper than gasoline cars",
        "Longer driving range"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "medium-low",
      context: "Public transportation systems are expanding in many cities to reduce traffic congestion and promote more sustainable commuting options.",
      question: "What is the goal of expanding public transportation?",
      options: [
        "Reducing traffic congestion",
        "Increasing car ownership",
        "Improving road infrastructure",
        "Decreasing public spending"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "medium-high",
      context: "Urbanization continues to increase, with more people moving to cities in search of better job opportunities and improved living conditions.",
      question: "What is the main driver of urbanization?",
      options: [
        "Job opportunities",
        "Access to healthcare",
        "Better education",
        "Climate change"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "hard",
      context: "The rise of digital technologies is reshaping the workforce, with automation and AI replacing traditional jobs in industries like manufacturing and logistics.",
      question: "What is the main impact of digital technologies on the workforce?",
      options: [
        "Job displacement",
        "Increased productivity",
        "Higher wages",
        "Improved work-life balance"
      ],
      correctAnswer: 0
    }
  ],
  slider9: [
    {
      difficulty: "easy",
      context: "The health benefits of a balanced diet are well-known, with many experts emphasizing the importance of eating a variety of foods.",
      question: "What is the key to a healthy diet?",
      options: [
        "Eating a variety of foods",
        "Consuming only fruits and vegetables",
        "Avoiding all carbohydrates",
        "Eating processed foods"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "medium-low",
      context: "Exercise plays a crucial role in maintaining good health, helping to reduce the risk of chronic diseases such as diabetes and heart disease.",
      question: "What is the benefit of regular exercise?",
      options: [
        "Reduces risk of chronic diseases",
        "Increases body weight",
        "Decreases energy levels",
        "Weakens muscles"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "medium-high",
      context: "Mental health awareness is growing, with more people seeking therapy and counseling to address issues like anxiety, depression, and stress.",
      question: "What is the main focus of mental health initiatives?",
      options: [
        "Addressing anxiety and depression",
        "Promoting physical fitness",
        "Increasing social interactions",
        "Improving sleep quality"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "hard",
      context: "The opioid crisis has become a major public health issue, with increasing numbers of people affected by addiction to prescription painkillers and illegal substances.",
      question: "What is the primary issue in the opioid crisis?",
      options: [
        "Addiction to painkillers",
        "Overuse of antibiotics",
        "Mental health problems",
        "High healthcare costs"
      ],
      correctAnswer: 0
    }
  ],
  slider10: [
    {
      difficulty: "easy",
      context: "Social entrepreneurship is gaining momentum, with more individuals and organizations focusing on creating social and environmental value rather than just profit.",
      question: "What is the goal of social entrepreneurship?",
      options: [
        "Creating social and environmental value",
        "Maximizing profits",
        "Expanding market share",
        "Increasing brand recognition"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "medium-low",
      context: "Corporate donations to charitable causes have increased, with businesses contributing to social initiatives as part of their corporate social responsibility programs.",
      question: "Why are businesses donating to charities?",
      options: [
        "To improve their public image",
        "To increase profits",
        "To expand their operations",
        "To comply with regulations"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "medium-high",
      context: "Sustainable business practices are becoming essential for companies to remain competitive, with customers increasingly demanding environmentally friendly products and services.",
      question: "What is the primary factor driving sustainability in business?",
      options: [
        "Customer demand for eco-friendly products",
        "Government regulations",
        "Cost savings",
        "Access to new markets"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "hard",
      context: "The push for ethical supply chains is growing, with companies under pressure to ensure that their products are sourced responsibly and that workers are treated fairly.",
      question: "What is the main focus of ethical supply chains?",
      options: [
        "Fair treatment of workers",
        "Maximizing profits",
        "Minimizing costs",
        "Increasing product availability"
      ],
      correctAnswer: 0
    }
  ],
  slider11: [
    {
      difficulty: "easy",
      context: "The use of data analytics is becoming more common in business decision-making, helping companies to make more informed choices and improve their strategies.",
      question: "What is the main benefit of using data analytics?",
      options: [
        "Improved decision-making",
        "Lower data costs",
        "Faster product launches",
        "More customer engagement"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "medium-low",
      context: "Companies are increasingly relying on big data to understand consumer preferences, predict market trends, and optimize their operations.",
      question: "How is big data helping companies?",
      options: [
        "Understanding consumer preferences",
        "Increasing production costs",
        "Reducing customer satisfaction",
        "Decreasing market competition"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "medium-high",
      context: "The rise of artificial intelligence and machine learning is enabling companies to automate complex processes and improve efficiency in various industries.",
      question: "What is the impact of AI on business operations?",
      options: [
        "Improved efficiency",
        "Higher labor costs",
        "Lower product quality",
        "Increased competition"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "hard",
      context: "Blockchain technology is revolutionizing industries by providing secure, transparent, and decentralized methods for conducting transactions and storing data.",
      question: "What is the main advantage of blockchain technology?",
      options: [
        "Security and transparency",
        "Speed of transactions",
        "Lower operational costs",
        "Higher scalability"
      ],
      correctAnswer: 0
    }
  ],
  slider12: [
    {
      difficulty: "easy",
      context: "Electric cars are increasingly popular due to their environmental benefits and lower operating costs compared to traditional gasoline-powered vehicles.",
      question: "What is the main advantage of electric cars?",
      options: [
        "Environmental benefits",
        "Higher top speed",
        "Cheaper than gasoline cars",
        "Longer driving range"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "medium-low",
      context: "The use of alternative energy sources is growing, with wind and solar energy becoming more affordable and accessible for both individuals and businesses.",
      question: "What is the primary benefit of alternative energy?",
      options: [
        "Affordability and accessibility",
        "Higher energy output",
        "Reliability in all conditions",
        "Lower energy consumption"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "medium-high",
      context: "Global efforts to reduce carbon emissions are being led by countries committed to the Paris Agreement, aiming to mitigate climate change and limit global warming.",
      question: "What is the goal of the Paris Agreement?",
      options: [
        "Reduce carbon emissions",
        "Increase industrial production",
        "Expand renewable energy use",
        "Decrease global population"
      ],
      correctAnswer: 0
    },
    {
      difficulty: "hard",
      context: "The transition to a circular economy is gaining momentum, with an emphasis on reducing waste and reusing resources in the production process.",
      question: "What is the focus of a circular economy?",
      options: [
        "Reducing waste and reusing resources",
        "Maximizing profits",
        "Increasing consumption",
        "Promoting fast fashion"
      ],
      correctAnswer: 0
    }
  ]
};

// Función para generar el HTML de un slider
function generateSliderHTML(sliderId, questions) {
  const exerciseNumber = sliderId.replace('slider', ''); // Obtener el número del slider desde el ID (slider1, slider2, ...)
  
  return `
    <div class="slider-container relative mb-12 mt-6 bg-white rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.1)] p-6">
      
      <div class="slider-wrapper overflow-hidden">
        <div id="${sliderId}" class="slider flex transition-transform duration-300 ease-in-out">
          ${questions.map((q, index) => `
            <div class="question-card flex-shrink-0 w-full">
              <div class="difficulty-indicator h-1 mb-4 rounded ${getDifficultyColor(q.difficulty)}"></div>
              
              <div class="slider-header mb-4">
                <h3 class="text-lg font-semibold text-gray-800">Ejercicio ${exerciseNumber}</h3>
              </div>

              <div class="question-content mb-12">
                <p class="text-gray-600 mb-4">${q.context}</p>
                ${q.image ? `
                  <div class="image-container mb-4 flex justify-center">
                    <img 
                      src="${q.image}" 
                      alt="Imagen de la pregunta" 
                      class="max-w-full h-auto rounded-lg max-h-[300px] object-contain"
                      onerror="this.style.display='none'"
                    />
                  </div>
                ` : ''}
                <p class="font-semibold mb-4">${q.question}</p>
                
                <div class="options space-y-3">
                  ${q.options.map((option, optIndex) => `
                    <div class="option cursor-pointer p-3 border-2 rounded"
                         onclick="handleAnswerSelection('${sliderId}', ${index}, ${optIndex}, ${q.correctAnswer})">
                      ${option}
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="slider-controls absolute bottom-4 left-0 right-0 flex justify-center items-center space-x-8 mt-6">
        <button onclick="moveSlider('${sliderId}', 'prev')" 
                class="nav-button p-3 text-green-700 hover:text-green-900 transition-colors">
          <i class="fas fa-chevron-left text-xl"></i>
        </button>
        <button onclick="clearSliderResponses('${sliderId}')" 
                class="clear-responses p-3 text-green-700 hover:text-green-900 transition-colors">
          <i class="fas fa-trash-alt text-xl"></i>
        </button>
        <button onclick="moveSlider('${sliderId}', 'next')" 
                class="nav-button p-3 text-green-700 hover:text-green-900 transition-colors">
          <i class="fas fa-chevron-right text-xl"></i>
        </button>
      </div>
    </div>
  `;
}

// Inicializar los sliders
function initializeSliders() {
  const ejerciciosTab = document.getElementById('ejercicios');
  ejerciciosTab.innerHTML = `
    ${generateSliderHTML('slider1', questionsData.slider1)}
    ${generateSliderHTML('slider2', questionsData.slider2)}
    ${generateSliderHTML('slider3', questionsData.slider3)}
    ${generateSliderHTML('slider4', questionsData.slider4)}
    ${generateSliderHTML('slider5', questionsData.slider5)}
    ${generateSliderHTML('slider6', questionsData.slider6)}
    ${generateSliderHTML('slider7', questionsData.slider7)}
    ${generateSliderHTML('slider8', questionsData.slider8)}
    ${generateSliderHTML('slider9', questionsData.slider9)}
    ${generateSliderHTML('slider10', questionsData.slider10)}
    ${generateSliderHTML('slider11', questionsData.slider11)}
    ${generateSliderHTML('slider12', questionsData.slider12)}
  `;

  // Restaurar las respuestas y estilos guardados
  restoreSavedAnswers('slider1');
  restoreSavedAnswers('slider2');
  restoreSavedAnswers('slider3');
  restoreSavedAnswers('slider4');
  restoreSavedAnswers('slider5');
  restoreSavedAnswers('slider6');
  restoreSavedAnswers('slider7');
  restoreSavedAnswers('slider8');
  restoreSavedAnswers('slider9');
  restoreSavedAnswers('slider10');
  restoreSavedAnswers('slider11');
  restoreSavedAnswers('slider12');
  
  // Inicializar el touch para móviles
  initializeTouchEvents();
}

// Función para obtener el color según la dificultad
function getDifficultyColor(difficulty) {
  const colors = {
    'easy': 'bg-green-500',
    'medium-low': 'bg-yellow-500',
    'medium-high': 'bg-orange-500',
    'hard': 'bg-red-500'
  };
  return colors[difficulty] || 'bg-gray-500';
}

// Manejar el deslizamiento
function moveSlider(sliderId, direction) {
  const slider = document.getElementById(sliderId);
  const currentPosition = parseInt(slider.style.transform?.match(/-?\d+/) || 0);
  const cardWidth = slider.firstElementChild.offsetWidth;
  const maxPosition = -(cardWidth * (slider.children.length - 1));
  
  let newPosition;
  if (direction === 'next') {
    newPosition = Math.max(currentPosition - cardWidth, maxPosition);
  } else {
    newPosition = Math.min(currentPosition + cardWidth, 0);
  }
  
  slider.style.transform = `translateX(${newPosition}px)`;
}

// Manejar la selección de respuestas
function handleAnswerSelection(sliderId, questionIndex, selectedOption, correctAnswer) {
    const storageKey = `${sliderId}_answers_${getUniqueKey('answers')}`;
    let answers = JSON.parse(localStorage.getItem(storageKey) || '{}');

    // Guardar la respuesta seleccionada
    answers[questionIndex] = {
        selected: selectedOption,
        correct: correctAnswer // Guardamos la respuesta correcta, no la comparación
    };
    localStorage.setItem(storageKey, JSON.stringify(answers));

    // Actualizar la UI
    const options = document.querySelectorAll(`#${sliderId} .question-card:nth-child(${questionIndex + 1}) .option`);
    options.forEach((option, index) => {
        option.classList.remove('border-green-500', 'border-red-500'); // Limpiar colores previos
        
        if (index === selectedOption) {
            // Solo colorear la opción seleccionada
            option.classList.add(index === correctAnswer ? 'border-green-500' : 'border-red-500');
        }

        // Marcar la respuesta correcta con verde, incluso si la respuesta seleccionada es incorrecta
        if (index === correctAnswer && index !== selectedOption) {
            option.classList.add('border-green-500');
        }

        option.classList.add('pointer-events-none'); // Deshabilitar interacción
    });
}

// Función para restaurar las respuestas y sus estilos guardados
function restoreSavedAnswers(sliderId) {
    const storageKey = `${sliderId}_answers_${getUniqueKey('answers')}`;
    const savedAnswers = JSON.parse(localStorage.getItem(storageKey) || '{}');

    Object.entries(savedAnswers).forEach(([questionIndex, answer]) => {
        const options = document.querySelectorAll(`#${sliderId} .question-card:nth-child(${parseInt(questionIndex) + 1}) .option`);
        
        options.forEach((option, index) => {
            option.classList.remove('border-green-500', 'border-red-500'); // Limpiar colores previos
            
            if (index === answer.selected) {
                // Colorear solo la opción que fue seleccionada
                option.classList.add(index === answer.correct ? 'border-green-500' : 'border-red-500');
            }

            // Marcar la respuesta correcta con verde, incluso si la respuesta seleccionada es incorrecta
            if (index === answer.correct && index !== answer.selected) {
                option.classList.add('border-green-500');
            }

            option.classList.add('pointer-events-none'); // Deshabilitar interacción
        });
    });
}

// Función para limpiar respuestas
function clearSliderResponses(sliderId) {
  const storageKey = `${sliderId}_answers_${getUniqueKey('answers')}`;
  localStorage.removeItem(storageKey);  // Eliminar respuestas del almacenamiento local
  const options = document.querySelectorAll(`#${sliderId} .option`);
  options.forEach(option => {
    option.classList.remove('border-green-500', 'border-red-500', 'pointer-events-none');  // Limpiar los estilos de las respuestas
  });
}

// Inicializar eventos touch para móviles
function initializeTouchEvents() {
  const sliders = document.querySelectorAll('.slider');
  
  sliders.forEach(slider => {
    let startX;
    let currentX;
    
    slider.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      currentX = parseInt(slider.style.transform?.match(/-?\d+/) || 0);
    });
    
    slider.addEventListener('touchmove', (e) => {
      const diff = startX - e.touches[0].clientX;
      const newPosition = currentX - diff;
      const maxPosition = -(slider.offsetWidth * (slider.children.length - 1));
      
      if (newPosition <= 0 && newPosition >= maxPosition) {
        slider.style.transform = `translateX(${newPosition}px)`;
      }
    });
    
    slider.addEventListener('touchend', (e) => {
      const cardWidth = slider.firstElementChild.offsetWidth;
      const currentPosition = parseInt(slider.style.transform?.match(/-?\d+/) || 0);
      const snapPosition = Math.round(currentPosition / cardWidth) * cardWidth;
      
      slider.style.transform = `translateX(${snapPosition}px)`;
    });
  });
}

// Inicializar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', initializeSliders);