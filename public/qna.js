// qna.js - Reddit-style discussion board for CollabHub

// Initialize Supabase client
// Note: In production, credentials should be loaded from environment configuration
let supabase = null;

// Try to load Supabase from CDN
if (typeof window.supabase !== 'undefined') {
  try {
    // In production, these should come from env/config
    // For now, we'll detect from window or use localStorage
    const savedUrl = localStorage.getItem('supabase_url');
    const savedKey = localStorage.getItem('supabase_key');
    
    if (savedUrl && savedKey) {
      supabase = window.supabase.createClient(savedUrl, savedKey);
    }
  } catch (err) {
    console.warn('Supabase initialization failed:', err);
  }
}

// In-memory storage for demo (if Supabase not available)
let questionsData = [];
let nextId = 1;

// DOM elements
const questionForm = document.getElementById('question-form');
const qTitle = document.getElementById('q-title');
const qBody = document.getElementById('q-body');
const qAuthor = document.getElementById('q-author');
const qFeedback = document.getElementById('q-feedback');
const questionsContainer = document.getElementById('questions-container');
const emptyNote = document.getElementById('empty-note');
const sortSelect = document.getElementById('sort-select');
const refreshBtn = document.getElementById('refresh-btn');

// Load some demo data if no questions exist
function loadDemoData() {
  if (questionsData.length === 0 && !supabase) {
    questionsData = [
      {
        id: nextId++,
        title: 'How to get started with React?',
        body: 'I\'m new to React and want to learn the basics. What resources would you recommend?',
        author: 'Developer123',
        upvotes: 5,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        answers: [
          {
            id: 1,
            body: 'Start with the official React documentation at react.dev. It has great tutorials!',
            author: 'ReactPro',
            created_at: new Date(Date.now() - 1800000).toISOString()
          }
        ]
      },
      {
        id: nextId++,
        title: 'Best practices for Node.js API development?',
        body: 'What are some best practices I should follow when building RESTful APIs with Node.js and Express?',
        author: 'BackendDev',
        upvotes: 3,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        answers: []
      }
    ];
  }
}

// Load questions on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDemoData();
  loadQuestions();
});

// Submit question
questionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  qFeedback.textContent = '';
  
  const title = qTitle.value.trim();
  const body = qBody.value.trim();
  const author = qAuthor.value.trim() || 'Anonymous';
  
  if (!title || !body) {
    qFeedback.textContent = 'Please fill in both title and body.';
    return;
  }
  
  try {
    if (supabase) {
      // Store in Supabase
      const { data, error } = await supabase
        .from('questions')
        .insert([
          {
            title,
            body,
            author,
            upvotes: 0,
            created_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      
      qFeedback.style.color = '#22c55e';
      qFeedback.textContent = 'Question posted successfully!';
    } else {
      // Store in memory
      const newQuestion = {
        id: nextId++,
        title,
        body,
        author,
        upvotes: 0,
        created_at: new Date().toISOString(),
        answers: []
      };
      questionsData.unshift(newQuestion);
      
      qFeedback.style.color = '#22c55e';
      qFeedback.textContent = 'Question posted successfully!';
    }
    
    // Clear form
    qTitle.value = '';
    qBody.value = '';
    qAuthor.value = '';
    
    // Reload questions
    await loadQuestions();
    
    setTimeout(() => {
      qFeedback.textContent = '';
    }, 3000);
  } catch (err) {
    console.error('Error posting question:', err);
    qFeedback.style.color = '#f97373';
    qFeedback.textContent = 'Error posting question. Please try again.';
  }
});

// Load and display questions
async function loadQuestions() {
  try {
    if (supabase) {
      // Load from Supabase
      const { data, error } = await supabase
        .from('questions')
        .select('*, answers(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      questionsData = data || [];
    }
    
    renderQuestions();
  } catch (err) {
    console.error('Error loading questions:', err);
    // Continue with in-memory data
    renderQuestions();
  }
}

// Render questions to DOM
function renderQuestions() {
  const sortBy = sortSelect.value;
  
  // Sort questions
  let sorted = [...questionsData];
  if (sortBy === 'top') {
    sorted.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  } else {
    sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  
  if (sorted.length === 0) {
    emptyNote.style.display = 'block';
    questionsContainer.innerHTML = '';
    return;
  }
  
  emptyNote.style.display = 'none';
  questionsContainer.innerHTML = sorted.map(q => createQuestionHTML(q)).join('');
  
  // Attach event listeners
  attachEventListeners();
}

// Create HTML for a single question
function createQuestionHTML(question) {
  const timeAgo = getTimeAgo(question.created_at);
  const answers = question.answers || [];
  
  return `
    <div class="post" data-id="${question.id}">
      <div class="vote-col">
        <button class="vote-btn upvote" data-id="${question.id}">▲</button>
        <div class="vote-score">${question.upvotes || 0}</div>
        <button class="vote-btn downvote" data-id="${question.id}">▼</button>
      </div>
      <div class="post-main">
        <div class="post-title">${escapeHtml(question.title)}</div>
        <div class="post-meta">Posted by ${escapeHtml(question.author)} • ${timeAgo}</div>
        <div class="post-body">${escapeHtml(question.body)}</div>
        <div class="post-actions">
          <span class="action-link toggle-answers" data-id="${question.id}">
            💬 ${answers.length} ${answers.length === 1 ? 'answer' : 'answers'}
          </span>
          <span class="action-link show-answer-form" data-id="${question.id}">✍️ Answer</span>
        </div>
        <div class="answers" id="answers-${question.id}" style="display:none;">
          ${answers.map(a => createAnswerHTML(a)).join('')}
          <form class="answer-form" data-question-id="${question.id}" style="display:none;">
            <textarea placeholder="Write your answer..." rows="3" required></textarea>
            <div class="author-row">
              <input type="text" placeholder="Your name (optional)" maxlength="50" />
              <button type="submit" class="btn primary">Post Answer</button>
            </div>
            <p class="answer-feedback"></p>
          </form>
        </div>
      </div>
    </div>
  `;
}

// Create HTML for an answer
function createAnswerHTML(answer) {
  const timeAgo = getTimeAgo(answer.created_at);
  return `
    <div class="answer-item">
      <div class="answer-head">${escapeHtml(answer.author || 'Anonymous')} • ${timeAgo}</div>
      <div class="answer-text">${escapeHtml(answer.body)}</div>
    </div>
  `;
}

// Attach event listeners to dynamic elements
function attachEventListeners() {
  // Upvote buttons
  document.querySelectorAll('.vote-btn.upvote').forEach(btn => {
    btn.addEventListener('click', () => handleVote(btn.dataset.id, 1));
  });
  
  // Downvote buttons
  document.querySelectorAll('.vote-btn.downvote').forEach(btn => {
    btn.addEventListener('click', () => handleVote(btn.dataset.id, -1));
  });
  
  // Toggle answers visibility
  document.querySelectorAll('.toggle-answers').forEach(btn => {
    btn.addEventListener('click', () => toggleAnswers(btn.dataset.id));
  });
  
  // Show answer form
  document.querySelectorAll('.show-answer-form').forEach(btn => {
    btn.addEventListener('click', () => showAnswerForm(btn.dataset.id));
  });
  
  // Submit answer forms
  document.querySelectorAll('.answer-form').forEach(form => {
    form.addEventListener('submit', (e) => handleAnswerSubmit(e, form));
  });
}

// Handle voting
async function handleVote(questionId, delta) {
  try {
    // Convert questionId to number for comparison
    const numericId = Number(questionId);
    const question = questionsData.find(q => q.id === numericId);
    if (!question) return;
    
    // Prevent negative scores
    const newScore = (question.upvotes || 0) + delta;
    if (newScore < 0) return;
    
    question.upvotes = newScore;
    
    if (supabase) {
      // Update in Supabase
      const { error } = await supabase
        .from('questions')
        .update({ upvotes: question.upvotes })
        .eq('id', numericId);
      
      if (error) throw error;
    }
    
    renderQuestions();
  } catch (err) {
    console.error('Error voting:', err);
  }
}

// Toggle answers visibility
function toggleAnswers(questionId) {
  const answersDiv = document.getElementById(`answers-${questionId}`);
  if (answersDiv.style.display === 'none') {
    answersDiv.style.display = 'block';
  } else {
    answersDiv.style.display = 'none';
  }
}

// Show answer form
function showAnswerForm(questionId) {
  const answersDiv = document.getElementById(`answers-${questionId}`);
  answersDiv.style.display = 'block';
  
  const form = answersDiv.querySelector('.answer-form');
  form.style.display = 'grid';
  form.querySelector('textarea').focus();
}

// Handle answer submission
async function handleAnswerSubmit(e, form) {
  e.preventDefault();
  
  const questionId = Number(form.dataset.questionId);
  const textarea = form.querySelector('textarea');
  const authorInput = form.querySelector('input[type="text"]');
  const feedback = form.querySelector('.answer-feedback');
  
  const body = textarea.value.trim();
  const author = authorInput.value.trim() || 'Anonymous';
  
  if (!body) {
    feedback.textContent = 'Please write an answer.';
    return;
  }
  
  try {
    const newAnswer = {
      question_id: questionId,
      body,
      author,
      created_at: new Date().toISOString()
    };
    
    if (supabase) {
      // Insert into Supabase
      const { error } = await supabase
        .from('answers')
        .insert([newAnswer]);
      
      if (error) throw error;
    } else {
      // Add to in-memory data
      const question = questionsData.find(q => q.id === questionId);
      if (question) {
        if (!question.answers) question.answers = [];
        // Use crypto API for better ID generation if available, fallback to timestamp + random
        const answerId = typeof crypto !== 'undefined' && crypto.randomUUID 
          ? crypto.randomUUID() 
          : Date.now() + Math.random();
        question.answers.push({
          ...newAnswer,
          id: answerId
        });
      }
    }
    
    // Clear form
    textarea.value = '';
    authorInput.value = '';
    feedback.style.color = '#22c55e';
    feedback.textContent = 'Answer posted!';
    
    setTimeout(() => {
      feedback.textContent = '';
      form.style.display = 'none';
    }, 2000);
    
    // Reload questions
    await loadQuestions();
  } catch (err) {
    console.error('Error posting answer:', err);
    feedback.textContent = 'Error posting answer.';
  }
}

// Sort change handler
sortSelect.addEventListener('change', () => {
  renderQuestions();
});

// Refresh button handler
refreshBtn.addEventListener('click', () => {
  loadQuestions();
});

// Utility: Get time ago string
function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// Utility: Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
