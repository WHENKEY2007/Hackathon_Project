// qna.js - Reddit-style discussion board for CollabHub

// In-memory storage for demo (if API fails)
let questionsData = [];

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

// New DOM elements for routing
const createPostBtn = document.getElementById('create-post-btn');
const questionDetail = document.getElementById('question-detail');
const detailContent = document.getElementById('detail-content');
const backBtn = document.getElementById('back-btn');
const feedHeader = document.querySelector('.feed-header');
const askContainer = document.getElementById('ask-container');
const cancelAskBtn = document.getElementById('cancel-ask-btn');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  await loadQuestions();
  handleRouting(); // Check URL on load
});

// Handle browser back/forward
window.addEventListener('popstate', handleRouting);

// --- Routing Logic ---
function handleRouting() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const view = params.get('view');

  if (view === 'ask') {
    showAskView();
  } else if (id) {
    showDetailView(id);
  } else {
    showListView();
  }
}

function navigateTo(url) {
  history.pushState(null, '', url);
  handleRouting();
}

// --- View Switchers ---

function showListView() {
  // Hide others
  questionDetail.style.display = 'none';
  askContainer.style.display = 'none';

  // Show List
  questionsContainer.style.display = 'flex';
  feedHeader.style.display = 'flex';

  // Show empty note only if no questions
  emptyNote.style.display = questionsData.length === 0 ? 'block' : 'none';

  // Refresh list to ensure vote counts are up to date
  renderQuestions();
}

function showDetailView(questionId) {
  const question = questionsData.find(q => q.id === Number(questionId));

  // If question not found (e.g. invalid ID), go back to list
  if (!question) {
    console.warn('Question not found:', questionId);
    // If we have data but can't find it, redirect. 
    // If data is empty, maybe we are still loading? 
    // But loadQuestions() is awaited in DOMContentLoaded.
    if (questionsData.length > 0) {
      navigateTo('qna.html');
    }
    return;
  }

  // Hide others
  questionsContainer.style.display = 'none';
  feedHeader.style.display = 'none';
  emptyNote.style.display = 'none';
  askContainer.style.display = 'none';

  // Show Detail
  questionDetail.style.display = 'block';
  renderDetail(question);
}

function showAskView() {
  // Hide others
  questionsContainer.style.display = 'none';
  feedHeader.style.display = 'none';
  emptyNote.style.display = 'none';
  questionDetail.style.display = 'none';

  // Show Ask Form
  askContainer.style.display = 'block';
  qTitle.focus();
}

// --- Event Listeners ---

// "Ask a Question" button -> Navigate to Ask View
createPostBtn.addEventListener('click', () => {
  navigateTo('?view=ask');
});

// Cancel Ask button -> Go back
cancelAskBtn.addEventListener('click', () => {
  history.back();
});

// Back button in Detail View -> Go back to list
backBtn.addEventListener('click', () => {
  // If we have history, go back. Else go to list.
  if (history.length > 1) {
    history.back();
  } else {
    navigateTo('qna.html');
  }
});

// Sort change handler
sortSelect.addEventListener('change', () => {
  renderQuestions();
});

// Refresh button handler
refreshBtn.addEventListener('click', () => {
  loadQuestions();
});

// --- Data & Rendering ---

// Load questions from API
async function loadQuestions() {
  try {
    const response = await fetch('/api/questions');
    if (!response.ok) throw new Error('Failed to fetch questions');

    questionsData = await response.json();
  } catch (err) {
    console.error('Error loading questions:', err);
    questionsData = [];
  }
}

// Render questions list (List View)
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
  questionsContainer.innerHTML = sorted.map(q => createQuestionSummaryHTML(q)).join('');

  // Attach event listeners for list view items
  attachListEventListeners();
}

// Create HTML for a single question summary (List View)
function createQuestionSummaryHTML(question) {
  const timeAgo = getTimeAgo(question.created_at);
  const answerCount = question.answers ? question.answers.length : 0;

  return `
    <div class="post" data-id="${question.id}">
      <div class="vote-col">
        <div class="vote-score">▲ ${question.upvotes || 0}</div>
      </div>
      <div class="post-main">
        <div class="post-title">${escapeHtml(question.title)}</div>
        <div class="post-meta">Posted by ${escapeHtml(question.author)} • ${timeAgo}</div>
        <div class="post-actions">
          <span>💬 ${answerCount} ${answerCount === 1 ? 'comment' : 'comments'}</span>
        </div>
      </div>
    </div>
  `;
}

// Attach event listeners for List View
function attachListEventListeners() {
  document.querySelectorAll('.post').forEach(post => {
    post.addEventListener('click', (e) => {
      // Prevent navigation if clicking vote buttons (if any)
      if (e.target.closest('.vote-btn')) return;

      const id = post.dataset.id;
      navigateTo(`?id=${id}`);
    });
  });
}

// Render detail view
function renderDetail(question) {
  const timeAgo = getTimeAgo(question.created_at);
  const answers = question.answers || [];

  detailContent.className = 'detail-view';
  detailContent.innerHTML = `
    <div class="post" style="cursor: default;">
      <div class="vote-col">
        <button class="vote-btn upvote" data-id="${question.id}">▲</button>
        <div class="vote-score">${question.upvotes || 0}</div>
        <button class="vote-btn downvote" data-id="${question.id}">▼</button>
      </div>
      <div class="post-main">
        <div class="post-title" style="font-size: 18px;">${escapeHtml(question.title)}</div>
        <div class="post-meta">Posted by ${escapeHtml(question.author)} • ${timeAgo}</div>
        <div class="post-body" style="font-size: 15px; margin-top: 8px;">${escapeHtml(question.body)}</div>
        
        <div class="answers-section">
          <h3>${answers.length} ${answers.length === 1 ? 'Answer' : 'Answers'}</h3>
          
          <form class="answer-form" data-question-id="${question.id}">
            <textarea placeholder="Write your answer..." rows="4" required></textarea>
            <div class="author-row">
              <input type="text" placeholder="Your name (optional)" maxlength="50" />
              <button type="submit" class="btn primary">Post Answer</button>
            </div>
            <p class="answer-feedback"></p>
          </form>

          <div class="answers-list">
            ${answers.map(a => createAnswerHTML(a)).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  attachDetailEventListeners();
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

// Attach event listeners for Detail View
function attachDetailEventListeners() {
  // Upvote buttons
  detailContent.querySelectorAll('.vote-btn.upvote').forEach(btn => {
    btn.addEventListener('click', () => handleVote(btn.dataset.id, 1));
  });

  // Downvote buttons
  detailContent.querySelectorAll('.vote-btn.downvote').forEach(btn => {
    btn.addEventListener('click', () => handleVote(btn.dataset.id, -1));
  });

  // Submit answer forms
  detailContent.querySelectorAll('.answer-form').forEach(form => {
    form.addEventListener('submit', (e) => handleAnswerSubmit(e, form));
  });
}

// --- Actions (Vote, Answer, Post Question) ---

// Submit question
questionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  qFeedback.textContent = '';

  const submitBtn = questionForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;

  // Set loading state
  submitBtn.textContent = 'Posting...';
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.7';

  const title = qTitle.value.trim();
  const body = qBody.value.trim();
  const author = qAuthor.value.trim() || 'Anonymous';

  if (!title || !body) {
    qFeedback.textContent = 'Please fill in both title and body.';
    submitBtn.textContent = originalBtnText;
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    return;
  }

  try {
    const response = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, author })
    });

    if (!response.ok) throw new Error('Failed to post question');

    qFeedback.style.color = '#22c55e';
    qFeedback.textContent = 'Question posted successfully!';

    // Clear form
    qTitle.value = '';
    qBody.value = '';
    qAuthor.value = '';

    // Reload questions to get the new one
    await loadQuestions();

    setTimeout(() => {
      qFeedback.textContent = '';
      // Navigate back to list view
      navigateTo('qna.html');
    }, 1000);
  } catch (err) {
    console.error('Error posting question:', err);
    qFeedback.style.color = '#f97373';
    qFeedback.textContent = 'Error posting question. Please try again.';
  } finally {
    // Reset loading state
    submitBtn.textContent = originalBtnText;
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
  }
});

// Handle voting
async function handleVote(questionId, delta) {
  try {
    const numericId = Number(questionId);
    const question = questionsData.find(q => q.id === numericId);
    if (!question) return;

    const newScore = (question.upvotes || 0) + delta;
    if (newScore < 0) return;

    const response = await fetch(`/api/questions/${numericId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upvotes: newScore })
    });

    if (!response.ok) throw new Error('Failed to update vote');

    question.upvotes = newScore;

    // Re-render detail view to show new score
    const scoreEl = detailContent.querySelector('.vote-score');
    if (scoreEl) scoreEl.textContent = newScore;

  } catch (err) {
    console.error('Error voting:', err);
  }
}

// Handle answer submission
async function handleAnswerSubmit(e, form) {
  e.preventDefault();

  const questionId = Number(form.dataset.questionId);
  const textarea = form.querySelector('textarea');
  const authorInput = form.querySelector('input[type="text"]');
  const feedback = form.querySelector('.answer-feedback');
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;

  // Set loading state
  submitBtn.textContent = 'Posting...';
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.7';

  const body = textarea.value.trim();
  const author = authorInput.value.trim() || 'Anonymous';

  if (!body) {
    feedback.textContent = 'Please write an answer.';
    submitBtn.textContent = originalBtnText;
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    return;
  }

  try {
    const response = await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId, body, author })
    });

    if (!response.ok) throw new Error('Failed to post answer');

    // Clear form
    textarea.value = '';
    authorInput.value = '';
    feedback.style.color = '#22c55e';
    feedback.textContent = 'Answer posted!';

    // Reload questions to get new answer
    await loadQuestions();

    // Re-render detail view
    const question = questionsData.find(q => q.id === questionId);
    if (question) renderDetail(question);

  } catch (err) {
    console.error('Error posting answer:', err);
    feedback.textContent = 'Error posting answer.';
  } finally {
    // Reset loading state
    submitBtn.textContent = originalBtnText;
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
  }
}

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
