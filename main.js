const APP_STATE = {
  currentView: 'home',
  data: null,
  progress: {},
  customGoals: {},
  lastReset: null
};

// --- Storage & Reset Logic ---

function loadProgress() {
  const saved = localStorage.getItem('azkar_progress');
  if (saved) {
    const parsed = JSON.parse(saved);
    APP_STATE.progress = parsed.progress || {};
    APP_STATE.customGoals = parsed.customGoals || {};
    APP_STATE.lastReset = parsed.lastReset;

    checkReset();
  } else {
    APP_STATE.progress = {};
    APP_STATE.customGoals = {};
    APP_STATE.lastReset = Date.now();
    saveProgress();
  }
}

function saveProgress() {
  localStorage.setItem('azkar_progress', JSON.stringify({
    progress: APP_STATE.progress,
    customGoals: APP_STATE.customGoals,
    lastReset: APP_STATE.lastReset
  }));
}

function checkReset() {
  if (!APP_STATE.lastReset) return;

  const lastDate = new Date(APP_STATE.lastReset);
  const now = new Date();

  // Adjust logic: Reset if it's a new day and time is past 1:00 AM
  // Or simpler: Compare "Logical Dates". A "Logical Day" starts at 1:00 AM.

  const getLogicalDateStr = (date) => {
    const d = new Date(date);
    // Subtract 1 hour to shift 1AM back to midnight of previous day physically, 
    // effectively making 1AM the start of the "new" day logic.
    // Actually, user wants reset at 1:00 AM.
    // If now is 00:30, it belongs to previous day.
    // If now is 01:30, it belongs to new day.
    d.setHours(d.getHours() - 1);
    return d.toDateString(); // "Mon Feb 12 2026"
  };

  const lastLogical = getLogicalDateStr(lastDate);
  const currentLogical = getLogicalDateStr(now);

  if (lastLogical !== currentLogical) {
    console.log("Resetting progress (New Day detected at 1:00 AM threshold)");
    APP_STATE.progress = {};
    APP_STATE.lastReset = Date.now();
    saveProgress();
  }
}

// --- Data Loading ---

async function loadData() {
  try {
    const response = await fetch('azkar_data.json');
    APP_STATE.data = await response.json();
    renderHome();
  } catch (error) {
    console.error("Failed to load data", error);
    document.getElementById('main-content').innerHTML = "<p style='text-align:center; padding:20px; color:red'>فشل تحميل البيانات</p>";
  }
}

// --- Views Rendering ---

function renderHome() {
  APP_STATE.currentView = 'home';
  const main = document.getElementById('main-content');
  main.innerHTML = '<div class="categories-grid"></div>';
  const grid = main.querySelector('.categories-grid');
  const template = document.getElementById('category-card-template');

  // Convert data object to array
  const categories = Object.values(APP_STATE.data);

  categories.forEach(cat => {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.category-card');

    card.querySelector('.category-title').textContent = cat.title;

    // Calculate progress
    const totalItems = cat.items.length;
    let totalProgressPercent = 0;
    cat.items.forEach((item, index) => {
      const itemId = `${cat.id}-${index}`;
      const targetCount = (cat.id === 'tasabeeh' && APP_STATE.customGoals && APP_STATE.customGoals[itemId] !== undefined)
        ? parseInt(APP_STATE.customGoals[itemId], 10)
        : parseInt(item.count, 10);
      const current = APP_STATE.progress[itemId] !== undefined ? APP_STATE.progress[itemId] : targetCount;
      const itemProgress = targetCount > 0 ? ((targetCount - current) / targetCount) : 0;
      totalProgressPercent += itemProgress;
    });

    const percent = totalItems > 0 ? Math.round((totalProgressPercent / totalItems) * 100) : 0;
    card.querySelector('.category-count').textContent = `${totalItems} ذكر`;
    card.querySelector('.category-progress').textContent = `${percent}%`;

    card.addEventListener('click', () => renderCategory(cat.id));
    grid.appendChild(clone);
  });

  updateNav('nav-home');
}

function renderCategory(categoryId) {
  APP_STATE.currentView = 'category';
  const catData = APP_STATE.data[categoryId];
  const main = document.getElementById('main-content');

  // Header
  main.innerHTML = `
        <div class="header-actions">
            <button class="back-btn" onclick="renderHome()">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                العودة للقائمة
            </button>
            ${categoryId === 'post_prayer' ? `
            <button class="reset-category-btn" onclick="resetCategoryProgress('${categoryId}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                ضبط للصلاة التالية
            </button>
            ` : ''}
        </div>
        <h2 style="margin-bottom: 20px; color: var(--primary-color)">${catData.title}</h2>
        <div id="azkar-list"></div>
    `;

  const list = document.getElementById('azkar-list');
  const template = document.getElementById('zkr-card-template');

  catData.items.forEach((item, index) => {
    const itemId = `${categoryId}-${index}`; // Unique ID for storage

    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.zkr-card');
    const countDisplay = clone.querySelector('.zkr-current-count');
    const progressBar = clone.querySelector('.progress-fill');
    const targetCountDisplay = clone.querySelector('.zkr-target-count');

    // Populate text
    clone.querySelector('.zkr-text').textContent = item.text;
    if (item.original_desc) {
      clone.querySelector('.zkr-description').textContent = item.original_desc;
    } else {
      clone.querySelector('.zkr-description').style.display = 'none';
    }

    // Render State
    const renderState = () => {
      const targetCount = (categoryId === 'tasabeeh' && APP_STATE.customGoals && APP_STATE.customGoals[itemId] !== undefined)
        ? parseInt(APP_STATE.customGoals[itemId], 10)
        : parseInt(item.count, 10);
      const current = APP_STATE.progress[itemId] !== undefined ? APP_STATE.progress[itemId] : targetCount;
      countDisplay.textContent = current;

      const progress = targetCount > 0 ? ((targetCount - current) / targetCount) * 100 : 0;
      progressBar.style.width = `${progress}%`;

      if (current === 0) {
        card.classList.add('completed');
        progressBar.style.backgroundColor = '#198754';
      } else {
        card.classList.remove('completed');
        progressBar.style.backgroundColor = 'var(--accent-color)';
      }

      targetCountDisplay.textContent = `الهدف: ${targetCount}`;
    };

    // Goal Editor Logic (Only for Tasbih category)
    if (categoryId === 'tasabeeh') {
      const editBtn = clone.querySelector('.edit-goal-btn');
      const goalEditor = clone.querySelector('.goal-editor');
      const customInput = clone.querySelector('.custom-goal-input');
      const saveBtn = clone.querySelector('.save-goal-action-btn');
      const cancelBtn = clone.querySelector('.cancel-goal-action-btn');

      // Show edit button
      editBtn.style.display = 'inline-flex';

      // Click edit button: toggle editor
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        // Close other goal editors to keep UI clean
        const allEditors = document.querySelectorAll('.goal-editor');
        allEditors.forEach(editor => {
          if (editor !== goalEditor) {
            editor.style.display = 'none';
          }
        });

        const isHidden = goalEditor.style.display === 'none';
        goalEditor.style.display = isHidden ? 'block' : 'none';

        if (isHidden) {
          const targetCount = APP_STATE.customGoals[itemId] !== undefined
            ? APP_STATE.customGoals[itemId]
            : item.count;
          customInput.value = targetCount;
          customInput.focus();
        }
      });

      // Prevent clicks on editor from decrementing count
      goalEditor.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // Update goal helper function
      const updateGoal = (newGoal) => {
        if (isNaN(newGoal) || newGoal <= 0) {
          alert('الرجاء إدخال هدف صحيح أكبر من الصفر');
          return;
        }
        APP_STATE.customGoals[itemId] = newGoal;
        // Reset progress to the new target goal
        APP_STATE.progress[itemId] = newGoal;
        saveProgress();
        renderState();
        goalEditor.style.display = 'none';
      };

      // Preset buttons clicks
      clone.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = parseInt(btn.getAttribute('data-value'), 10);
          updateGoal(val);
        });
      });

      // Save custom goal click
      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = parseInt(customInput.value, 10);
        updateGoal(val);
      });

      // Cancel click
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        goalEditor.style.display = 'none';
      });
    }

    // Initial render
    renderState();

    // Interaction
    card.addEventListener('click', () => {
      const targetCount = (categoryId === 'tasabeeh' && APP_STATE.customGoals && APP_STATE.customGoals[itemId] !== undefined)
        ? parseInt(APP_STATE.customGoals[itemId], 10)
        : parseInt(item.count, 10);
      let current = APP_STATE.progress[itemId] !== undefined ? APP_STATE.progress[itemId] : targetCount;

      if (current > 0) {
        current--;
        APP_STATE.progress[itemId] = current;
        saveProgress();
        renderState();

        // Vibration
        if (navigator.vibrate) navigator.vibrate(50);
      }
    });

    list.appendChild(clone);
  });
}

function renderSettings() {
  APP_STATE.currentView = 'settings';
  const main = document.getElementById('main-content');
  main.innerHTML = `
        <div class="settings-container">
            <h2 style="margin-bottom: 20px; color: var(--primary-color)">الإعدادات</h2>
            <div class="setting-item">
                <span>إعادة ضبط العدادات</span>
                <button class="btn-danger" onclick="resetAllProgress()">اعادة تعيين</button>
            </div>
            <p style="color: grey; font-size: 0.9rem; text-align: center; margin-top: 20px">
                يتم تصفير العدادات تلقائياً كل يوم الساعة 1:00 صباحاً
            </p>
        </div>
    `;
  updateNav('nav-settings');
}

function resetAllProgress() {
  if (confirm('هل أنت متأكد من تصفير جميع العدادات؟')) {
    APP_STATE.progress = {};
    APP_STATE.lastReset = Date.now();
    saveProgress();
    alert('تم التصفير بنجاح');
    renderSettings(); // Re-render to refresh any state if needed
  }
}

function updateNav(activeId) {
  document.querySelectorAll('#bottom-nav button').forEach(btn => btn.classList.remove('active'));
  document.getElementById(activeId).classList.add('active');
}

// --- Utils ---
function updateDate() {
  const d = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('date-display').textContent = d.toLocaleDateString('ar-SA', options);
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
  loadProgress();
  updateDate();
  loadData();

  // Nav Listeners
  document.getElementById('nav-home').addEventListener('click', renderHome);
  document.getElementById('nav-settings').addEventListener('click', renderSettings);
});

function resetCategoryProgress(categoryId) {
  if (confirm('هل تريد إعادة ضبط عدادات هذا القسم فقط للصلاة التالية؟')) {
    const catData = APP_STATE.data[categoryId];
    catData.items.forEach((item, index) => {
      const itemId = `${categoryId}-${index}`;
      delete APP_STATE.progress[itemId];
    });
    saveProgress();
    renderCategory(categoryId);
  }
}

// Expose functions to window for onclick handlers
window.renderHome = renderHome;
window.resetAllProgress = resetAllProgress;
window.resetCategoryProgress = resetCategoryProgress;
