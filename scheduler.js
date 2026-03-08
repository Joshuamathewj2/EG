class Scheduler {
    /**
     * Returns today's schedule.
     * If a schedule was already generated today (lastGeneratedDate === today),
     * it returns the stored schedule WITHOUT regenerating — so page refreshes
     * never reset tasks or progress.
     *
     * A brand-new schedule is only created when the calendar day changes
     * (or when clearSchedule() was called, e.g. after editing the syllabus).
     */
    static getOrGenerateTodaySchedule() {
        const data = Storage.getData();
        if (!data || !data.subjects || data.subjects.length === 0) return null;

        const todayStr = new Date().toISOString().split('T')[0];
        const storedDate = Storage.getLastGeneratedDate();

        // ── Same day → just return what we already have ──
        if (storedDate === todayStr) {
            const existing = Storage.getSchedule();
            if (existing) return existing;
            // Edge-case: key exists but schedule was wiped → fall through to regenerate
        }

        // ── New day (or first launch) → generate fresh schedule ──
        return Scheduler._buildSchedule(data, todayStr);
    }

    /** Internal: build, persist, and return a new daily schedule. */
    static _buildSchedule(data, todayStr) {
        const newTasks = [];

        data.subjects.forEach((subject, subIndex) => {
            // Skip subjects whose exam date is already past
            const examDate = new Date(subject.examDate);
            examDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (examDate < today) return;

            let topicsAssigned = 0;
            let tempIndex = subject.currentIndex;

            while (topicsAssigned < subject.pace && tempIndex < subject.topics.length) {
                newTasks.push({
                    id: `task-${subIndex}-${tempIndex}`,
                    subject: subject.name,
                    topic: subject.topics[tempIndex],
                    completed: false,
                    topicIndex: tempIndex
                });
                topicsAssigned++;
                tempIndex++;
            }
        });

        const newSchedule = {
            date: todayStr,
            tasks: newTasks
        };

        Storage.saveSchedule(newSchedule);
        Storage.setLastGeneratedDate(todayStr);
        return newSchedule;
    }

    static markTaskCompleted(taskId, completed) {
        const schedule = Storage.getSchedule();
        if (!schedule) return;

        const task = schedule.tasks.find(t => t.id === taskId);
        if (task && task.completed !== completed) {
            task.completed = completed;
            Storage.saveSchedule(schedule);

            const data = Storage.getData();
            const subject = data.subjects.find(s => s.name === task.subject);
            if (subject) {
                subject.currentIndex += (completed ? 1 : -1);
                subject.currentIndex = Math.max(0, Math.min(subject.currentIndex, subject.topics.length));
                Storage.saveData(data);
            }
        }
    }
}
