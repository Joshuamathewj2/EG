const SUBJECTS = [
    "Linear Algebra and Number Theory",
    "Design Analysis and Algorithm",
    "Object Oriented Software Engineering",
    "Operating Systems",
    "Microprocessors and Microcontrollers",
    "Foundation of Data Science"
];

document.addEventListener('DOMContentLoaded', () => {
    // Register the FCM-compatible service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./firebase-messaging-sw.js')
            .catch(err => console.error("SW Registration failed:", err));
    }

    const data = Storage.getData();
    // If the user already has data, and we are on index.html, we might want to guide them to dashboard
    if (data && data.subjects && data.subjects.length > 0) {
        const header = document.querySelector('header');
        if (header && !document.getElementById('go-to-dash')) {
            const btn = document.createElement('button');
            btn.id = 'go-to-dash';
            btn.className = 'btn-secondary';
            btn.innerText = 'Go to Dashboard →';
            btn.onclick = () => window.location.href = 'dashboard.html';
            header.appendChild(btn);
        }
    }

    renderSubjects();

    const form = document.getElementById('syllabus-form');
    if (form) {
        form.addEventListener('submit', handleGenerate);
    }
});

function renderSubjects() {
    const container = document.getElementById('subjects-container');
    if (!container) return;

    const existingData = Storage.getData().subjects || [];

    // Default exam date to 1 month from now if not set
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() + 1);
    const defaultDateStr = defaultDate.toISOString().split('T')[0];
    const minDateStr = new Date().toISOString().split('T')[0];

    SUBJECTS.forEach((subjectName, i) => {
        const saved = existingData.find(s => s.name === subjectName) || {};

        const card = document.createElement('div');
        card.className = 'glass subject-card';
        card.innerHTML = `
            <h3>${subjectName}</h3>
            <div class="input-group">
                <label>Syllabus Topics (comma or newline separated)</label>
                <textarea id="topics-${i}" rows="3" placeholder="Linked Lists, Stacks, Queues, Trees...">${saved.topics ? saved.topics.join(', ') : ''}</textarea>
            </div>
            <div class="row">
                <div class="input-group">
                    <label>Exam Date</label>
                    <input type="date" id="date-${i}" value="${saved.examDate || defaultDateStr}" min="${minDateStr}" required>
                </div>
                <div class="input-group">
                    <label>Pace</label>
                    <div class="segmented-control">
                        <input type="radio" name="pace-${i}" id="pace-${i}-1" value="1" ${(!saved.pace || saved.pace == 1) ? 'checked' : ''}>
                        <label for="pace-${i}-1">1 / day</label>
                        <input type="radio" name="pace-${i}" id="pace-${i}-2" value="2" ${saved.pace == 2 ? 'checked' : ''}>
                        <label for="pace-${i}-2">2 / day</label>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function handleGenerate(e) {
    e.preventDefault();
    const subjectsToSave = [];

    for (let i = 0; i < SUBJECTS.length; i++) {
        const name = SUBJECTS[i];
        const topicsStr = document.getElementById(`topics-${i}`).value;
        const examDate = document.getElementById(`date-${i}`).value;

        // Find which radio is checked for pace
        const pace = document.getElementById(`pace-${i}-1`).checked ? 1 : 2;

        if (topicsStr.trim() !== '') {
            const rawTopics = topicsStr.split(/[\n,]+/).map(t => t.trim()).filter(t => t !== '');
            const uniqueTopics = [...new Set(rawTopics)]; // Deduplicate

            const existingData = Storage.getData().subjects || [];
            const saved = existingData.find(s => s.name === name) || {};

            subjectsToSave.push({
                name,
                topics: uniqueTopics,
                examDate,
                pace,
                currentIndex: saved.currentIndex || 0
            });
        }
    }

    if (subjectsToSave.length === 0) {
        alert("Please enter syllabus topics for at least one subject.");
        return;
    }

    // Check if any exam date is earlier than today locally
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hasPastExam = subjectsToSave.some(s => {
        const ed = new Date(s.examDate);
        ed.setHours(0, 0, 0, 0);
        return ed < today;
    });

    if (hasPastExam) {
        alert("One or more exam dates are in the past. Please select valid dates.");
        return;
    }

    Storage.saveData({ subjects: subjectsToSave });

    // Clear current schedule to force regeneration
    Storage.clearSchedule();

    window.location.href = 'dashboard.html';
}
