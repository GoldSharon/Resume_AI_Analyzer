// =========================
// Resume AI Analyzer Script
// =========================

let currentResumeText = '';
let currentJobDescription = '';

// DOM Elements
const elements = {
   form: document.getElementById('resumeForm'),
   loading: document.getElementById('loadingSection'),
   results: document.getElementById('results'),
   chatArea: document.getElementById('chatArea'),
   chatMessages: document.getElementById('chatMessages'),
   chatInput: document.getElementById('chatInput'),
   sendBtn: document.getElementById('sendBtn'),
   fileInput: document.getElementById('resume'),
   fileText: document.querySelector('.file-input-display .file-text'),
   fileWrapper: document.querySelector('.file-input-wrapper'),
   jobDesc: document.getElementById('jobDescription'),
   errorNote: document.getElementById('errorNotification')
};

// ========== File Input ==========
elements.fileInput.addEventListener('change', () => {
   const file = elements.fileInput.files[0];
   elements.fileText.textContent = file ? file.name : 'Choose file or drag & drop';
   elements.fileText.style.color = file ? '#667eea' : '#666';
});

// ========== Drag & Drop ==========
['dragover', 'dragleave', 'drop'].forEach(evt => {
   elements.fileWrapper.addEventListener(evt, e => e.preventDefault());
});

elements.fileWrapper.addEventListener('dragover', () => {
   elements.fileWrapper.style.borderColor = '#667eea';
   elements.fileWrapper.style.backgroundColor = '#f0f4ff';
});

elements.fileWrapper.addEventListener('dragleave', () => {
   resetDropStyles();
});

elements.fileWrapper.addEventListener('drop', e => {
   resetDropStyles();
   const file = e.dataTransfer.files[0];
   if (file) {
       elements.fileInput.files = e.dataTransfer.files;
       elements.fileText.textContent = file.name;
       elements.fileText.style.color = '#667eea';
   }
});

function resetDropStyles() {
   elements.fileWrapper.style.borderColor = '#ddd';
   elements.fileWrapper.style.backgroundColor = '#fafafa';
}

// ========== Form Submission ==========
elements.form.addEventListener('submit', async e => {
   e.preventDefault();

   const file = elements.fileInput.files[0];
   const jobDesc = elements.jobDesc.value.trim();

   if (!file) return showError('Please select a resume file.');

   const formData = new FormData();
   formData.append('file', file);
   if (jobDesc) {
       formData.append('job_description', jobDesc);
       currentJobDescription = jobDesc;
   }

   showLoading();

   try {
       const res = await fetch('/upload-resume', {
           method: 'POST',
           body: formData
       });

       if (!res.ok) throw new Error(`Server returned status ${res.status}`);
       const data = await res.json();

       displayResults(data);
       currentResumeText = await readFileAsText(file);
   } catch (err) {
       console.error(err);
       showError('Resume analysis failed. Try again later.');
   } finally {
       hideLoading();
   }
});

// ========== Helper Functions ==========
function showLoading() {
   elements.loading.style.display = 'block';
   elements.results.style.display = 'none';
   elements.chatArea.style.display = 'none';
   animateLoadingSteps();
}

function hideLoading() {
   elements.loading.style.display = 'none';
}

function showError(msg) {
   elements.errorNote.textContent = msg;
   elements.errorNote.style.display = 'block';
   setTimeout(() => elements.errorNote.style.display = 'none', 5000);
}

function readFileAsText(file) {
   return new Promise((resolve, reject) => {
       const reader = new FileReader();
       reader.onload = e => resolve(e.target.result);
       reader.onerror = reject;
       reader.readAsText(file);
   });
}

// ========== Loading Animation ==========
function animateLoadingSteps() {
   const steps = document.querySelectorAll('.loading-section .step');
   steps.forEach(step => step.classList.remove('active'));
   
   let currentStep = 0;
   const interval = setInterval(() => {
       if (currentStep < steps.length) {
           steps[currentStep].classList.add('active');
           currentStep++;
       } else {
           clearInterval(interval);
       }
   }, 1000);
}

// ========== Score Ring Animation ==========
function animateScoreRing(score) {
    const scoreRing = document.getElementById('scoreProgress');
    if (!scoreRing) return;
    
    // Calculate the circumference and dash offset
    const radius = 50;
    const circumference = 2 * Math.PI * radius; // 314.16
    const percentage = score / 100;
    const dashOffset = circumference - (percentage * circumference);
    
    // Reset the animation
    scoreRing.style.strokeDasharray = circumference;
    scoreRing.style.strokeDashoffset = circumference;
    
    // Animate the ring
    setTimeout(() => {
        scoreRing.style.transition = 'stroke-dashoffset 2s ease-in-out';
        scoreRing.style.strokeDashoffset = dashOffset;
    }, 300);
    
    // Update the stroke color based on score
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        const scoreClass = scoreElement.className;
        let strokeColor = '#667eea'; // default
        
        if (scoreClass.includes('excellent')) strokeColor = '#10b981';
        else if (scoreClass.includes('good')) strokeColor = '#3b82f6';
        else if (scoreClass.includes('fair')) strokeColor = '#f59e0b';
        else if (scoreClass.includes('poor')) strokeColor = '#ef4444';
        
        scoreRing.style.stroke = strokeColor;
    }
}

// Enhanced text cleaning function that preserves LaTeX
function cleanText(text) {
   if (!text) return '';
   
   // First, protect LaTeX expressions by temporarily replacing them
   const latexProtection = [];
   let protectedText = text;
   
   // Protect display math $$...$$
   protectedText = protectedText.replace(/\$\$([\s\S]*?)\$\$/g, (match, content) => {
       const index = latexProtection.length;
       latexProtection.push(match);
       return `__LATEX_DISPLAY_${index}__`;
   });
   
   // Protect inline math $...$
   protectedText = protectedText.replace(/\$([^$\n]+)\$/g, (match, content) => {
       const index = latexProtection.length;
       latexProtection.push(match);
       return `__LATEX_INLINE_${index}__`;
   });
   
   // Protect LaTeX commands \command{...}
   protectedText = protectedText.replace(/\\[a-zA-Z]+\{[^}]*\}/g, (match) => {
       const index = latexProtection.length;
       latexProtection.push(match);
       return `__LATEX_COMMAND_${index}__`;
   });
   
   // Protect standalone Greek letters and symbols
   protectedText = protectedText.replace(/\\[a-zA-Z]+/g, (match) => {
       const index = latexProtection.length;
       latexProtection.push(match);
       return `__LATEX_SYMBOL_${index}__`;
   });
   
   // Now clean the text without affecting LaTeX
   let cleanedText = protectedText
       .replace(/<think>[\s\S]*?<\/think>/gi, '')
       .replace(/^#{1,6}\s*.*$/gm, '')
       .replace(/\*\*(.*?)\*\*/g, '$1')
       .replace(/\*(.*?)\*/g, '$1')
       .replace(/`(.*?)`/g, '$1')
       .replace(/```[\s\S]*?```/g, '')
       .replace(/\n{3,}/g, '\n\n')
       .trim();
   
   // Restore LaTeX expressions
   latexProtection.forEach((latex, index) => {
       cleanedText = cleanedText.replace(`__LATEX_DISPLAY_${index}__`, latex);
       cleanedText = cleanedText.replace(`__LATEX_INLINE_${index}__`, latex);
       cleanedText = cleanedText.replace(`__LATEX_COMMAND_${index}__`, latex);
       cleanedText = cleanedText.replace(`__LATEX_SYMBOL_${index}__`, latex);
   });
   
   return cleanedText;
}

// LaTeX-aware text processing
function processLatexText(text) {
   if (!text) return '';
   
   // Clean the text but preserve LaTeX syntax
   let processedText = cleanText(text);
   
   // Convert markdown formatting to HTML while preserving LaTeX
   processedText = processedText
       .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
       .replace(/\*(.*?)\*/g, '<em>$1</em>')
       .replace(/`([^`]+)`/g, '<code>$1</code>')
       .replace(/\n/g, '<br>');
   
   return processedText;
}

// ========== Display Results ==========
function displayResults(data) {
   const score = data.ats_score;
   const scoreText = `${score}/100`;

   const scoreClass = score >= 80 ? 'excellent' :
                      score >= 60 ? 'good' :
                      score >= 40 ? 'fair' : 'poor';

   const feedback = {
       excellent: 'Excellent! Your resume is well-optimized for ATS systems.',
       good: 'Good score! Some improvements could boost your ATS compatibility.',
       fair: 'Fair score. Consider implementing suggested improvements.',
       poor: 'Needs improvement. Focus on the suggestions below.'
   };

   document.getElementById('score').textContent = scoreText;
   document.getElementById('score').className = `ats-score ${scoreClass}`;
   document.getElementById('scoreDescription').innerHTML = `<p>${feedback[scoreClass]}</p>`;

   // Animate the score ring
   animateScoreRing(score);

   const section = document.getElementById('analysis');
   section.innerHTML = `
       <div class="section"><h3>📊 Overall Assessment</h3><p>${processLatexText(data.overall_feedback)}</p></div>
       <div class="section"><h3>💪 Strengths</h3><ul>${data.strengths.map(s => `<li>${processLatexText(s)}</li>`).join('')}</ul></div>
       <div class="section"><h3>⚠️ Areas for Improvement</h3><ul>${data.weaknesses.map(w => `<li>${processLatexText(w)}</li>`).join('')}</ul></div>
       <div class="section"><h3>🎯 Actionable Suggestions</h3><ul>${data.suggestions.map(s => `<li>${processLatexText(s)}</li>`).join('')}</ul></div>
       ${generateKeywordHTML(data.keyword_match)}
   `;

   elements.results.style.display = 'block';
   elements.chatArea.style.display = 'block';
   elements.chatMessages.innerHTML = `
       <div class="message ai-message">
           <div class="message-label">AI Assistant</div>
           <div class="tex2jax_process">Hello! I've analyzed your resume. Ask me anything about the results or how to improve.</div>
       </div>
   `;
   
   // Trigger MathJax processing for the initial message
   if (window.MathJax && window.MathJax.typesetPromise) {
       window.MathJax.typesetPromise([elements.chatMessages]);
   }
   
   elements.results.scrollIntoView({ behavior: 'smooth' });
}

function generateKeywordHTML(match = {}) {
   const matched = match.matched_keywords || [];
   const missing = match.missing_keywords || [];

   if (!matched.length && !missing.length) return '';

   return `
       <div class="section"><h3>🔍 Keyword Analysis</h3>
           ${matched.length ? `<h4>Matched Keywords (${matched.length})</h4>
           <div class="keyword-tags">${matched.map(k => `<span class="keyword-tag matched">${processLatexText(k)}</span>`).join('')}</div>` : ''}
           ${missing.length ? `<h4>Missing Keywords (${missing.length})</h4>
           <div class="keyword-tags">${missing.slice(0, 10).map(k => `<span class="keyword-tag missing">${processLatexText(k)}</span>`).join('')}</div>` : ''}
       </div>
   `;
}

// ========== Chat ==========
elements.chatInput.addEventListener('keypress', e => {
   if (e.key === 'Enter' && !e.shiftKey) {
       e.preventDefault();
       sendChatMessage();
   }
});

// Character counter for chat input
elements.chatInput.addEventListener('input', e => {
   const length = e.target.value.length;
   const counter = document.querySelector('.char-counter');
   if (counter) {
       counter.textContent = `${length}/500`;
   }
});

// Job description character counter
elements.jobDesc.addEventListener('input', e => {
   const length = e.target.value.length;
   const counter = document.querySelector('.char-count');
   if (counter) {
       counter.textContent = `${length} characters`;
   }
});

async function sendChatMessage() {
   const message = elements.chatInput.value.trim();
   if (!message || !currentResumeText) return;

   setChatInputState(true);
   appendChatMessage('user', message);
   elements.chatInput.value = '';
   
   const counter = document.querySelector('.char-counter');
   if (counter) {
       counter.textContent = '0/500';
   }

   try {
       const res = await fetch('/chat', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
               message,
               resume_text: currentResumeText,
               job_description: currentJobDescription
           })
       });

       if (!res.ok) throw new Error('Chat request failed');
       const data = await res.json();
       appendChatMessage('ai', data.response, true); // true for LaTeX processing
   } catch (err) {
       console.error(err);
       appendChatMessage('ai', 'Sorry, something went wrong. Please try again.');
   } finally {
       setChatInputState(false);
   }
}

function setChatInputState(disabled) {
   elements.chatInput.disabled = disabled;
   elements.sendBtn.disabled = disabled;
   elements.sendBtn.innerHTML = disabled ? '<span class="send-icon">⏳</span>' : '<span class="send-icon">➤</span>';
}

function appendChatMessage(type, text, processLatex = false) {
   const div = document.createElement('div');
   div.className = `message ${type}-message`;
   
   const messageContent = processLatex ? processLatexText(text) : text;
   
   div.innerHTML = `
       <div class="message-label">${type === 'user' ? 'You' : 'AI Assistant'}</div>
       <div class="tex2jax_process">${messageContent}</div>
   `;
   
   elements.chatMessages.appendChild(div);
   elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
   
   // Process LaTeX in the new message
   if (processLatex && window.MathJax && window.MathJax.typesetPromise) {
       window.MathJax.typesetPromise([div]).then(() => {
           elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
       }).catch(err => {
           console.error('MathJax processing error:', err);
       });
   }
}

function askSuggestion(question) {
   const chatInput = document.getElementById('chatInput');
   if (chatInput) {
       chatInput.value = question;
       // Update character counter
       const counter = document.querySelector('.char-counter');
       if (counter) {
           counter.textContent = `${question.length}/500`;
       }
       sendChatMessage();
   } else {
       console.error('Chat input not found');
   }
}

// ========== Initialize ==========
// Ensure MathJax is ready
document.addEventListener('DOMContentLoaded', function() {
   if (window.MathJax) {
       console.log('MathJax loaded successfully');
   } else {
       console.warn('MathJax not loaded');
   }
   
   // Initialize character counter for job description
   const jobDescCounter = document.querySelector('.char-count');
   if (jobDescCounter) {
       jobDescCounter.textContent = '0 characters';
   }
   
   // Initialize character counter for chat input
   const chatCounter = document.querySelector('.char-counter');
   if (chatCounter) {
       chatCounter.textContent = '0/500';
   }
});