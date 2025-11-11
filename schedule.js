// 日程记事本系统 JavaScript

// 全局变量
let scheduleCurrentYear = new Date().getFullYear();
let scheduleCurrentMonth = new Date().getMonth();
let scheduleCurrentDate = null;

// 初始化日程系统
function initScheduleSystem() {
    console.log('初始化日程记事本系统');

    renderScheduleCalendar();
    renderScheduleRecentEntries();

    // 绑定事件监听
    document.getElementById('schedulePrevMonth').addEventListener('click', () => {
        scheduleCurrentMonth--;
        if (scheduleCurrentMonth < 0) {
            scheduleCurrentMonth = 11;
            scheduleCurrentYear--;
        }
        renderScheduleCalendar();
    });

    document.getElementById('scheduleNextMonth').addEventListener('click', () => {
        scheduleCurrentMonth++;
        if (scheduleCurrentMonth > 11) {
            scheduleCurrentMonth = 0;
            scheduleCurrentYear++;
        }
        renderScheduleCalendar();
    });

    // 表单提交事件
    const scheduleForm = document.getElementById('scheduleForm');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveScheduleData();
        });
    }

    // 删除按钮事件
    const deleteBtn = document.getElementById('scheduleDeleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            if (confirm('确定要删除这一天的所有记录吗？')) {
                localStorage.removeItem('schedule_' + scheduleCurrentDate);
                showToast('已删除！', 'success');
                backToScheduleCalendar();
            }
        });
    }

    // 添加时间段按钮
    const addTimeBlockBtn = document.getElementById('scheduleAddTimeBlock');
    if (addTimeBlockBtn) {
        addTimeBlockBtn.addEventListener('click', function() {
            const timeBlocks = document.getElementById('scheduleTimeBlocks');
            const newBlock = createScheduleTimeBlock();
            timeBlocks.appendChild(newBlock);
        });
    }

    // 添加任务按钮
    const addTaskBtn = document.getElementById('scheduleAddTask');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', function() {
            const tasksContainer = document.getElementById('scheduleTasksContainer');
            const newTask = createScheduleTaskItem();
            tasksContainer.appendChild(newTask);
        });
    }
}

// 渲染日历
function renderScheduleCalendar() {
    const calendar = document.getElementById('scheduleCalendar');
    const monthTitle = document.getElementById('scheduleCurrentMonth');

    // 设置月份标题
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                        '七月', '八月', '九月', '十月', '十一月', '十二月'];
    monthTitle.textContent = `${scheduleCurrentYear}年 ${monthNames[scheduleCurrentMonth]}`;

    // 清空日历
    calendar.innerHTML = '';

    // 添加星期标题
    const dayHeaders = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'schedule-day-header';
        header.textContent = day;
        calendar.appendChild(header);
    });

    // 获取当月第一天是星期几
    const firstDay = new Date(scheduleCurrentYear, scheduleCurrentMonth, 1).getDay();

    // 获取当月有多少天
    const daysInMonth = new Date(scheduleCurrentYear, scheduleCurrentMonth + 1, 0).getDate();

    // 获取上个月有多少天
    const prevMonthDays = new Date(scheduleCurrentYear, scheduleCurrentMonth, 0).getDate();

    // 添加上个月的日期
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        createScheduleDayElement(day, true, scheduleCurrentMonth === 0 ? scheduleCurrentYear - 1 : scheduleCurrentYear,
                                scheduleCurrentMonth === 0 ? 11 : scheduleCurrentMonth - 1);
    }

    // 添加当月的日期
    for (let day = 1; day <= daysInMonth; day++) {
        createScheduleDayElement(day, false, scheduleCurrentYear, scheduleCurrentMonth);
    }

    // 添加下个月的日期补齐
    const totalCells = calendar.children.length - 7; // 减去星期标题
    const remainingCells = 42 - totalCells; // 6行7列
    for (let day = 1; day <= remainingCells; day++) {
        createScheduleDayElement(day, true, scheduleCurrentMonth === 11 ? scheduleCurrentYear + 1 : scheduleCurrentYear,
                                scheduleCurrentMonth === 11 ? 0 : scheduleCurrentMonth + 1);
    }
}

// 创建日期元素
function createScheduleDayElement(day, isOtherMonth, year, month) {
    const calendar = document.getElementById('scheduleCalendar');
    const dayElement = document.createElement('div');
    dayElement.className = 'schedule-calendar-day';

    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }

    // 检查是否是今天
    const today = new Date();
    if (day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear() &&
        !isOtherMonth) {
        dayElement.classList.add('today');
    }

    // 创建日期字符串
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // 检查是否有记录
    const hasEntry = localStorage.getItem('schedule_' + dateStr);
    if (hasEntry) {
        dayElement.classList.add('has-entry');
        const indicator = document.createElement('div');
        indicator.className = 'schedule-day-indicator';
        indicator.textContent = '●';
        dayElement.appendChild(indicator);
    }

    const dayNumber = document.createElement('div');
    dayNumber.className = 'schedule-day-number';
    dayNumber.textContent = day;
    dayElement.insertBefore(dayNumber, dayElement.firstChild);

    // 点击跳转到编辑页面
    if (!isOtherMonth) {
        dayElement.addEventListener('click', () => {
            showScheduleEditView(dateStr);
        });
    }

    calendar.appendChild(dayElement);
}

// 渲染最近的记录
function renderScheduleRecentEntries() {
    const recentList = document.getElementById('scheduleRecentList');
    recentList.innerHTML = '';

    // 获取所有记录
    const entries = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // 只获取日程记事本的记录
        if (key.startsWith('schedule_')) {
            const dateStr = key.replace('schedule_', '');
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                const data = JSON.parse(localStorage.getItem(key));
                entries.push({
                    date: dateStr,
                    data: data
                });
            }
        }
    }

    // 按日期排序（最新的在前）
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 只显示最近5条
    const recentEntries = entries.slice(0, 5);

    if (recentEntries.length === 0) {
        recentList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">暂无记录，点击日历上的日期开始记录吧！</p>';
        return;
    }

    recentEntries.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'schedule-recent-item';

        const dateDiv = document.createElement('div');
        dateDiv.className = 'schedule-recent-date';
        dateDiv.textContent = formatScheduleDate(entry.date);

        const titleDiv = document.createElement('div');
        titleDiv.className = 'schedule-recent-title';
        titleDiv.textContent = entry.data.title || '(无标题)';

        item.appendChild(dateDiv);
        item.appendChild(titleDiv);

        item.addEventListener('click', () => {
            showScheduleEditView(entry.date);
        });

        recentList.appendChild(item);
    });
}

// 格式化日期
function formatScheduleDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[date.getDay()];

    return `${year}年${month}月${day}日 ${weekday}`;
}

// 显示编辑视图
function showScheduleEditView(dateStr) {
    scheduleCurrentDate = dateStr;

    // 隐藏日历视图，显示编辑视图
    document.getElementById('scheduleCalendarView').style.display = 'none';
    document.getElementById('scheduleEditView').style.display = 'block';

    // 设置标题
    document.getElementById('scheduleEditDate').textContent = formatScheduleDate(dateStr);

    // 加载已保存的数据
    loadScheduleData(dateStr);
}

// 返回日历视图
function backToScheduleCalendar() {
    document.getElementById('scheduleCalendarView').style.display = 'block';
    document.getElementById('scheduleEditView').style.display = 'none';

    // 刷新日历和最近记录
    renderScheduleCalendar();
    renderScheduleRecentEntries();
}

// 创建时间段元素
function createScheduleTimeBlock(data = {}) {
    const div = document.createElement('div');
    div.className = 'schedule-time-block';
    div.innerHTML = `
        <div class="schedule-form-grid">
            <div class="schedule-form-group">
                <label>开始时间</label>
                <input type="time" name="startTime[]" value="${data.startTime || ''}">
            </div>
            <div class="schedule-form-group">
                <label>结束时间</label>
                <input type="time" name="endTime[]" value="${data.endTime || ''}">
            </div>
            <div class="schedule-form-group schedule-full-width-grid">
                <label>活动内容</label>
                <input type="text" name="activity[]" placeholder="做什么..." value="${data.activity || ''}">
            </div>
        </div>
    `;
    return div;
}

// 创建任务元素
function createScheduleTaskItem(data = {}) {
    const div = document.createElement('div');
    div.className = 'schedule-task-item';
    div.innerHTML = `
        <input type="checkbox" name="taskDone[]" class="schedule-task-checkbox" ${data.done ? 'checked' : ''}>
        <input type="text" name="taskContent[]" placeholder="任务描述..." class="schedule-task-input" value="${data.content || ''}">
        <select name="taskPriority[]" class="schedule-task-priority">
            <option value="low" ${data.priority === 'low' ? 'selected' : ''}>低</option>
            <option value="medium" ${data.priority === 'medium' ? 'selected' : ''}>中</option>
            <option value="high" ${data.priority === 'high' ? 'selected' : ''}>高</option>
            <option value="urgent" ${data.priority === 'urgent' ? 'selected' : ''}>紧急</option>
        </select>
    `;
    return div;
}

// 保存数据
function saveScheduleData() {
    const form = document.getElementById('scheduleForm');
    const formData = new FormData(form);

    const data = {
        title: formData.get('title'),
        mood: formData.get('mood'),
        weather: formData.get('weather'),
        notes: formData.get('notes'),
        goals: formData.get('goals'),
        tomorrow: formData.get('tomorrow'),
        tags: formData.get('tags'),
        timeBlocks: [],
        tasks: []
    };

    // 收集时间段
    const startTimes = formData.getAll('startTime[]');
    const endTimes = formData.getAll('endTime[]');
    const activities = formData.getAll('activity[]');
    for (let i = 0; i < startTimes.length; i++) {
        if (startTimes[i] || endTimes[i] || activities[i]) {
            data.timeBlocks.push({
                startTime: startTimes[i],
                endTime: endTimes[i],
                activity: activities[i]
            });
        }
    }

    // 收集任务
    const taskDones = document.querySelectorAll('input[name="taskDone[]"]');
    const taskContents = formData.getAll('taskContent[]');
    const taskPriorities = formData.getAll('taskPriority[]');
    for (let i = 0; i < taskContents.length; i++) {
        if (taskContents[i]) {
            data.tasks.push({
                done: taskDones[i].checked,
                content: taskContents[i],
                priority: taskPriorities[i]
            });
        }
    }

    // 保存到localStorage
    localStorage.setItem('schedule_' + scheduleCurrentDate, JSON.stringify(data));
    showToast('保存成功！', 'success');
    backToScheduleCalendar();
}

// 加载数据
function loadScheduleData(dateStr) {
    const savedData = localStorage.getItem('schedule_' + dateStr);

    // 重置表单
    document.getElementById('scheduleTitle').value = '';
    document.getElementById('scheduleMood').value = '';
    document.getElementById('scheduleWeather').value = '';
    document.getElementById('scheduleNotes').value = '';
    document.getElementById('scheduleGoals').value = '';
    document.getElementById('scheduleTomorrow').value = '';
    document.getElementById('scheduleTags').value = '';

    // 重置时间块和任务
    document.getElementById('scheduleTimeBlocks').innerHTML = '';
    document.getElementById('scheduleTasksContainer').innerHTML = '';

    // 添加默认的一个时间块和一个任务
    document.getElementById('scheduleTimeBlocks').appendChild(createScheduleTimeBlock());
    document.getElementById('scheduleTasksContainer').appendChild(createScheduleTaskItem());

    if (!savedData) return;

    const data = JSON.parse(savedData);

    // 填充基本信息
    document.getElementById('scheduleTitle').value = data.title || '';
    document.getElementById('scheduleMood').value = data.mood || '';
    document.getElementById('scheduleWeather').value = data.weather || '';
    document.getElementById('scheduleNotes').value = data.notes || '';
    document.getElementById('scheduleGoals').value = data.goals || '';
    document.getElementById('scheduleTomorrow').value = data.tomorrow || '';
    document.getElementById('scheduleTags').value = data.tags || '';

    // 加载时间段
    if (data.timeBlocks && data.timeBlocks.length > 0) {
        const timeBlocks = document.getElementById('scheduleTimeBlocks');
        timeBlocks.innerHTML = '';
        data.timeBlocks.forEach(block => {
            timeBlocks.appendChild(createScheduleTimeBlock(block));
        });
    }

    // 加载任务
    if (data.tasks && data.tasks.length > 0) {
        const tasksContainer = document.getElementById('scheduleTasksContainer');
        tasksContainer.innerHTML = '';
        data.tasks.forEach(task => {
            tasksContainer.appendChild(createScheduleTaskItem(task));
        });
    }
}
