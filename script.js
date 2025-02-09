// Use ES module syntax

// Define the AI models
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
const conversationDuration = 4000; // duration between messages in ms
let conversationInterval;
let conversationTimer;
let selectedModels = []; // will hold the two models chosen to speak

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
  const threshold = parseInt(thresholdSlider.value);
  let decisionTimes = models.map(m => {
    return { model: m, decision: Math.random() * 100 - threshold };
  });
  decisionTimes.sort((a, b) => a.decision - b.decision);
  return decisionTimes[0].model;
}

// Given one model picks a topic, simulate a conversation reply from another model.
function selectSecondModel(firstModel) {
  const others = models.filter(m => m.id !== firstModel.id);
  return others[getRandomInt(0, others.length - 1)];
}

// A very, very, very, very, very, very, very, very, very large list of diverse topics.
const extendedTopicsList = [
  "astronomy discoveries", "quantum physics", "deep-sea exploration", "ancient civilizations",
  "futuristic technology", "classical literature", "sustainable agriculture", "virtual reality",
  "urban development", "medieval art", "philosophical debates", "music theory", "space travel",
  "robotics", "mythical creatures", "avant-garde fashions", "cosmology", "machine learning",
  "abstract painting", "global cuisines", "environmental conservation", "modern architecture",
  "psychology", "oceanography", "historical mysteries", "theoretical mathematics",
  "cybersecurity", "biotechnology", "renewable energy", "political science", "sports analytics",
  "economic theories", "lifestyle design", "healthcare innovations", "sociology", "linguistics",
  "virtual communities", "digital art", "literary criticism", "ethics in AI", "dystopian futures",
  "cultural anthropology", "global economics", "evolutionary biology", "genetics", "wildlife conservation",
  "space colonization", "cryptocurrencies", "emerging art movements", "philosophy of science", "martial arts",
  "public policy", "geopolitics", "sustainable design", "computational theory", "data visualization",
  "privacy rights", "the evolution of language", "entertainment industry", "social movements", "innovation in education"
];

// Function to call the external LLM endpoint
/**
 * Sends a POST request with role and conversation context.
 * @param {object} model - AI model
 * @param {array} conversationHistory - array of conversation history objects with role and text
 * @returns {string} AI response
 */
async function fetchAIResponse(model, conversationHistory) {
  // Create the base conversation context string.
  let contextString = conversationHistory.length > 0 
    ? conversationHistory.map(item => `${item.role}: ${item.text}`).join('\n')
    : "No prior conversation context available.";

  // If context is minimal, instruct the LLM to generate its own context based on an extensive list of topics.
  if (conversationHistory.length === 0) {
    contextString += "\n\nSince there is very little context provided, please feel free to create your own context about what to talk about. Here is a very large and diverse list of topics for inspiration: " + extendedTopicsList.join(", ") + ".";
  }
  
  const promptMessage = `You are ${model.name}. You are playing the role of an AI engaging in a conversation simulation.
Current conversation context: 
${contextString}

Based on this conversation, provide your next message in a natural and engaging style.`;
  
  try {
    const response = await fetch('/api/ai_completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        prompt: promptMessage,
        // Data can be passed if needed using conversationHistory
        data: conversationHistory
      })
    });
    const data = await response.json();
    // Assuming response has a field "message" with AI's response.
    // Example response: { "message": "Your reply here." }
    return data.message || "Sorry, I have nothing to add.";
  } catch (error) {
    console.error('Error fetching AI response:', error);
    return "Oops, an error occurred.";
  }
}

// Use SpeechSynthesis API to speak text
function speakText(text, voiceUri) {
  const utterance = new SpeechSynthesisUtterance(text);
  const availableVoices = window.speechSynthesis.getVoices();
  const voice = availableVoices.find(v => v.voiceURI === voiceUri);
  if (voice) {
    utterance.voice = voice;
  }
  window.speechSynthesis.speak(utterance);
}

// Render a conversation message and update conversation context
/**
 * Adds a conversation message to the conversation element and updates conversation context.
 * @param {object} model - AI model
 * @param {string} text - conversation message text
 * @param {string} sideClass - CSS class for the conversation message
 * @param {array} conversationHistory - array of conversation history objects with role and text
 */
function addMessage(model, text, sideClass, conversationHistory) {
  const messageEl = document.createElement('div');
  messageEl.classList.add('message', sideClass);
  
  const avatar = document.createElement('div');
  avatar.classList.add('avatar');
  avatar.textContent = model.name ? model.name.charAt(0) : "S";
  
  const msgText = document.createElement('div');
  msgText.classList.add('text');
  msgText.textContent = text;
  
  messageEl.appendChild(avatar);
  messageEl.appendChild(msgText);
  conversationEl.appendChild(messageEl);
  conversationEl.scrollTop = conversationEl.scrollHeight;
  
  // Append to conversation history for future context
  conversationHistory.push({ role: model.name || "System", text });
}

// Main conversation loop
/**
 * Starts a conversation loop between two AI models.
 * @param {object} firstModel - first AI model
 * @param {object} secondModel - second AI model
 */
async function conversationLoop(firstModel, secondModel) {
  let turn = 1;  // 1 means turn for second model; 0 for first model response next.
  let conversationHistory = [];

  // First model initiates the conversation by fetching an initial topic.
  const initialResponse = await fetchAIResponse(firstModel, conversationHistory);
  addMessage(firstModel, initialResponse, 'ai-1', conversationHistory);
  speakText(initialResponse, firstModel.voiceUri);

  // Set a repeating interval for back-and-forth conversation.
  conversationInterval = setInterval(async () => {
    // Determine the speaking model based on turn.
    const speakingModel = turn === 1 ? secondModel : firstModel;
    // Fetch response from LLM, including the entire conversation context.
    const reply = await fetchAIResponse(speakingModel, conversationHistory);
    const sideClass = speakingModel.id === firstModel.id ? 'ai-1' : 'ai-2';
    addMessage(speakingModel, reply, sideClass, conversationHistory);
    speakText(reply, speakingModel.voiceUri);
    
    // Alternate turn
    turn = turn === 1 ? 0 : 1;
  }, conversationDuration);

  // End conversation after 30 seconds
  conversationTimer = setTimeout(() => {
    clearInterval(conversationInterval);
    addMessage({ name: "System" }, "Conversation ended.", 'ai-1', conversationHistory);
  }, 30000);
}

/**
 * Starts a conversation between two AI models.
 */
function startConversation() {
  // Clear previous conversation
  conversationEl.innerHTML = '';
  window.speechSynthesis.cancel();  // Cancel any ongoing speech
  
  // Select models based on decision simulation
  const firstModel = selectFirstModel();
  const secondModel = selectSecondModel(firstModel);
  selectedModels = [firstModel, secondModel];

  // Start conversation loop
  conversationLoop(firstModel, secondModel);
}

startButton.addEventListener('click', startConversation);

// Preload voices (workaround for asynchronous load in some browsers)
if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}