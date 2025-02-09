// Use ES module syntax

const models = [
  { id: 'ai1', name: 'Alice', voiceUri: 'Google UK English Female', speaking: false },
  { id: 'ai2', name: 'Bob', voiceUri: 'Google UK English Male', speaking: false },
  { id: 'ai3', name: 'Cathy', voiceUri: 'Google español', speaking: false },
  { id: 'ai4', name: 'David', voiceUri: 'Google Deutsch', speaking: false },
  { id: 'ai5', name: 'Eva', voiceUri: 'Google español', speaking: false },
  { id: 'ai6', name: 'Frank', voiceUri: 'Google UK English Male', speaking: false },
  { id: 'ai7', name: 'Grace', voiceUri: 'Google UK English Female', speaking: false },
  { id: 'ai8', name: 'Henry', voiceUri: 'Google Deutsch', speaking: false },
  { id: 'ai9', name: 'Ivy', voiceUri: 'Google español', speaking: false },
  { id: 'ai10', name: 'Jack', voiceUri: 'Google UK English Male', speaking: false }
];

// Simulation settings:
const conversationDuration = 4000; // ms between messages
let selectedModels = []; // will hold the two models chosen to speak
let conversationInterval;

// Elements
const startButton = document.getElementById('startConversation');
const conversationEl = document.getElementById('conversation');
const thresholdSlider = document.getElementById('thresholdSlider');

// Utility: Get a random integer from min (inclusive) to max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Simulate decision-making: first model to speak is the one with minimal random value
function selectFirstModel() {
  // Using a route simulation: each model "decides" their readiness as a random number combined with slider threshold adjustment
  const threshold = parseInt(thresholdSlider.value);
  let decisionTimes = models.map(m => {
    // Lower decision score means quicker response, subtract slider influence randomly
    return { model: m, decision: Math.random() * 100 - threshold };
  });
  decisionTimes.sort((a, b) => a.decision - b.decision);
  return decisionTimes[0].model;
}

// Given one model picks a topic, simulate a conversation reply from another model.
function selectSecondModel(firstModel) {
  // Choose any model except the first
  const others = models.filter(m => m.id !== firstModel.id);
  return others[getRandomInt(0, others.length - 1)];
}

// Use browser SpeechSynthesis API to speak text
function speakText(text, voiceUri) {
  const utterance = new SpeechSynthesisUtterance(text);
  // Try to select a voice matching the voiceUri if available:
  const availableVoices = window.speechSynthesis.getVoices();
  const voice = availableVoices.find(v => v.voiceURI === voiceUri);
  if (voice) {
    utterance.voice = voice;
  }
  window.speechSynthesis.speak(utterance);
}

// Render a conversation message
function addMessage(model, text, sideClass) {
  const messageEl = document.createElement('div');
  messageEl.classList.add('message', sideClass);
  
  const avatar = document.createElement('div');
  avatar.classList.add('avatar');
  avatar.textContent = model.name.charAt(0);
  
  const msgText = document.createElement('div');
  msgText.classList.add('text');
  msgText.textContent = text;
  
  messageEl.appendChild(avatar);
  messageEl.appendChild(msgText);
  conversationEl.appendChild(messageEl);
  conversationEl.scrollTop = conversationEl.scrollHeight;
}

// Conversation messages simulation
const topics = [
  "The meaning of life",
  "Latest technology trends",
  "Space exploration",
  "Modern art influences",
  "Virtual reality in education"
];

const responses = [
  "Very interesting point of view.",
  "I think there's more to it.",
  "That opens up new insights.",
  "Could you elaborate further?",
  "I agree, especially on that aspect."
];

function startConversation() {
  // Clear previous conversation
  conversationEl.innerHTML = '';
  window.speechSynthesis.cancel();  // Cancel any ongoing speech

  // Select models based on decision time simulation
  const firstModel = selectFirstModel();
  const secondModel = selectSecondModel(firstModel);
  selectedModels = [firstModel, secondModel];

  // Display initial topic from first model
  const chosenTopic = topics[getRandomInt(0, topics.length - 1)];
  addMessage(firstModel, `Let's talk about: ${chosenTopic}`, 'ai-1');
  speakText(`Let's talk about: ${chosenTopic}`, firstModel.voiceUri);

  let turn = 1; // 1 for second model, 0 for first model responding.
  // Setup conversation interval for a back-and-forth
  conversationInterval = setInterval(() => {
    // Randomly pick one of the responses
    const reply = responses[getRandomInt(0, responses.length - 1)];
    const speakingModel = turn === 1 ? secondModel : firstModel;
    // Use different styling for each model's turn
    const sideClass = speakingModel.id === firstModel.id ? 'ai-1' : 'ai-2';
    addMessage(speakingModel, reply, sideClass);
    speakText(reply, speakingModel.voiceUri);
    // Alternate turn
    turn = turn === 1 ? 0 : 1;
  }, conversationDuration);

  // Stop the conversation after a fixed duration (e.g., 30 seconds)
  setTimeout(() => {
    clearInterval(conversationInterval);
    addMessage({ name: "System" }, "Conversation ended.", 'ai-1');
  }, 30000);
}

startButton.addEventListener('click', startConversation);

// Preload voices (workaround for some browsers where voices load asynchronously)
if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}