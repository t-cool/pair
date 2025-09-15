// Global variables
let currentEditingClass = null;
let currentAbsenceClass = null;
let currentAbsentStudents = [];

// Navigation menu management
function toggleMenu() {
    const overlay = document.getElementById('navOverlay');
    overlay.classList.toggle('active');
}

// Screen management
function showScreen(screenName) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    
    if (screenName === 'pair') {
        document.getElementById('pairScreen').classList.add('active');
    } else if (screenName === 'management') {
        document.getElementById('managementScreen').classList.add('active');
        loadClassList();
    }
}

// New class creation functions
function showNewClassForm() {
    document.getElementById('newClassSection').style.display = 'block';
    document.getElementById('editClassSection').style.display = 'none';
}

function cancelNewClass() {
    document.getElementById('newClassSection').style.display = 'none';
    document.getElementById('newClassName').value = '';
    document.getElementById('newClassStudentList').value = '';
}

function saveNewClass() {
    const className = document.getElementById('newClassName').value.trim();
    const studentList = document.getElementById('newClassStudentList').value.trim();
    
    if (!className) {
        alert('クラス名を入力してください。');
        return;
    }
    
    if (!studentList) {
        alert('生徒名簿を入力してください。');
        return;
    }
    
    const students = studentList.split('\n').filter(name => name.trim() !== '');
    
    if (students.length === 0) {
        alert('有効な生徒名が入力されていません。');
        return;
    }
    
    const cleanStudents = students.map(name => name.trim());
    
    // Check if class already exists
    const classes = getAllClasses();
    if (classes[className]) {
        if (!confirm('同じ名前のクラスが既に存在します。上書きしますか？')) {
            return;
        }
    }
    
    saveClass(className, cleanStudents);
    alert(className + 'のクラスデータ（' + cleanStudents.length + '名）を作成しました。');
    
    // Clear form and reload class list
    document.getElementById('newClassName').value = '';
    document.getElementById('newClassStudentList').value = '';
    document.getElementById('newClassSection').style.display = 'none';
    loadClassList();
    updateClassSelectorMain();
}

// Class storage management
function getAllClasses() {
    const classes = localStorage.getItem('pairMakerClasses');
    return classes ? JSON.parse(classes) : {};
}

function saveClass(className, students) {
    const classes = getAllClasses();
    classes[className] = {
        students: students,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    localStorage.setItem('pairMakerClasses', JSON.stringify(classes));
}

function deleteClassData(className) {
    const classes = getAllClasses();
    delete classes[className];
    localStorage.setItem('pairMakerClasses', JSON.stringify(classes));
}

// Updated save function
function saveStudentData() {
    const className = document.getElementById('className').value.trim();
    const studentList = document.getElementById('studentList').value.trim();
    
    if (!className) {
        alert('クラス名を入力してください。');
        return;
    }
    
    if (!studentList) {
        alert('生徒名簿を入力してください。');
        return;
    }
    
    const students = studentList.split('\n').filter(name => name.trim() !== '');
    
    if (students.length === 0) {
        alert('有効な生徒名が入力されていません。');
        return;
    }
    
    const cleanStudents = students.map(name => name.trim());
    
    saveClass(className, cleanStudents);
    alert(className + 'のクラスデータ（' + cleanStudents.length + '名）を保存しました。');
    updateStudentCount(cleanStudents.length);
    updateClassSelectorMain();
}

// Class selector management for pair creation
function updateClassSelectorMain() {
    const selector = document.getElementById('classSelectorMain');
    const classes = getAllClasses();
    
    if (!selector) return;
    
    selector.innerHTML = '<option value="">-- クラスを選択してください --</option>';
    
    Object.keys(classes).forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className + ' (' + classes[className].students.length + '名)';
        selector.appendChild(option);
    });
}

// New function for pair creation screen
function createPairsFromSelection() {
    const selector = document.getElementById('classSelectorMain');
    const selectedClass = selector.value;
    
    if (selectedClass) {
        const classes = getAllClasses();
        if (classes[selectedClass]) {
            // Clear absent students when switching classes
            if (currentAbsenceClass !== selectedClass) {
                currentAbsentStudents = [];
                currentAbsenceClass = null;
            }
            // Automatically create pairs
            createPairsForClass(selectedClass, classes[selectedClass].students);
        }
    } else {
        document.getElementById('pairResults').innerHTML = '';
        // Clear absent students when no class is selected
        currentAbsentStudents = [];
        currentAbsenceClass = null;
    }
}

function createPairsManual() {
    const selector = document.getElementById('classSelectorMain');
    const selectedClass = selector.value;
    
    if (selectedClass) {
        const classes = getAllClasses();
        if (classes[selectedClass]) {
            // Check if there are absent students for this class
            if (currentAbsenceClass === selectedClass && currentAbsentStudents.length > 0) {
                // Filter out absent students
                const presentStudents = classes[selectedClass].students.filter(student => 
                    !currentAbsentStudents.includes(student)
                );
                createPairsForClass(selectedClass, presentStudents);
            } else {
                // Use all students
                createPairsForClass(selectedClass, classes[selectedClass].students);
            }
        }
    }
}

function createPairsForClass(className, students) {
    if (students.length < 2) {
        alert('ペアを作成するには最低2名の生徒が必要です。');
        return;
    }
    
    const shuffledStudents = students.slice().sort(() => Math.random() - 0.5);
    const pairs = [];
    
    for (let i = 0; i < shuffledStudents.length; i += 2) {
        if (i + 1 < shuffledStudents.length) {
            pairs.push([shuffledStudents[i], shuffledStudents[i + 1]]);
        } else {
            pairs.push([shuffledStudents[i], '（1人）']);
        }
    }
    
    displayPairs(pairs, className);
}

// Class list management
function loadClassList() {
    const classes = getAllClasses();
    const classList = document.getElementById('classList');
    
    if (Object.keys(classes).length === 0) {
        classList.innerHTML = '<p class="no-classes">保存されたクラスがありません。</p>';
        return;
    }
    
    let html = '';
    Object.entries(classes).forEach(function(entry) {
        const className = entry[0];
        const classData = entry[1];
        html += '<div class="class-item">';
        html += '<div class="class-info">';
        html += '<h4>' + className + '</h4>';
        html += '<p>生徒数: ' + classData.students.length + '名</p>';
        html += '<p>最終更新: ' + new Date(classData.updatedAt).toLocaleDateString('ja-JP') + '</p>';
        html += '</div>';
        html += '<div class="class-actions">';
        html += '<button onclick="editClass(\'' + className + '\')" class="edit-btn">編集</button>';
        html += '<button onclick="useClass(\'' + className + '\')" class="use-btn">使用</button>';
        html += '<button onclick="openAbsenceModal(\'' + className + '\')" class="absence-btn">欠席管理</button>';
        html += '</div>';
        html += '</div>';
    });
    
    classList.innerHTML = html;
}

function editClass(className) {
    const classes = getAllClasses();
    if (!classes[className]) return;
    
    currentEditingClass = className;
    document.getElementById('editClassName').textContent = className;
    document.getElementById('editClassSection').style.display = 'block';
    
    loadStudentEditList(classes[className].students);
}

function loadStudentEditList(students) {
    const editList = document.getElementById('studentEditList');
    
    let html = '';
    students.forEach(function(student, index) {
        html += '<div class="student-edit-item">';
        html += '<input type="text" value="' + student + '" onchange="updateStudentName(' + index + ', this.value)">';
        html += '<button onclick="removeStudent(' + index + ')" class="remove-btn">削除</button>';
        html += '</div>';
    });
    
    editList.innerHTML = html;
}

function updateStudentName(index, newName) {
    if (!currentEditingClass) return;
    
    const classes = getAllClasses();
    classes[currentEditingClass].students[index] = newName.trim();
    localStorage.setItem('pairMakerClasses', JSON.stringify(classes));
}

function removeStudent(index) {
    if (!currentEditingClass) return;
    
    const classes = getAllClasses();
    classes[currentEditingClass].students.splice(index, 1);
    localStorage.setItem('pairMakerClasses', JSON.stringify(classes));
    
    loadStudentEditList(classes[currentEditingClass].students);
}

function addStudent() {
    const newName = document.getElementById('newStudentName').value.trim();
    if (!newName || !currentEditingClass) return;
    
    const classes = getAllClasses();
    classes[currentEditingClass].students.push(newName);
    localStorage.setItem('pairMakerClasses', JSON.stringify(classes));
    
    document.getElementById('newStudentName').value = '';
    loadStudentEditList(classes[currentEditingClass].students);
}

function saveClassChanges() {
    if (!currentEditingClass) return;
    
    const classes = getAllClasses();
    classes[currentEditingClass].updatedAt = new Date().toISOString();
    localStorage.setItem('pairMakerClasses', JSON.stringify(classes));
    
    alert('変更を保存しました。');
    loadClassList();
}

function deleteClass() {
    if (!currentEditingClass) return;
    
    if (confirm(currentEditingClass + 'を削除してもよろしいですか？')) {
        deleteClassData(currentEditingClass);
        document.getElementById('editClassSection').style.display = 'none';
        currentEditingClass = null;
        loadClassList();
        updateClassSelectorMain();
    }
}

function cancelEdit() {
    document.getElementById('editClassSection').style.display = 'none';
    document.getElementById('newClassSection').style.display = 'none';
    currentEditingClass = null;
    loadClassList();
}

function useClass(className) {
    const classes = getAllClasses();
    if (!classes[className]) return;
    
    // Set the class selector to the selected class
    document.getElementById('classSelectorMain').value = className;
    
    // Automatically create pairs for the selected class
    createPairsForClass(className, classes[className].students);
    
    showScreen('pair');
}

// Legacy support for old localStorage format
function migrateLegacyData() {
    const oldData = localStorage.getItem('pairMakerData');
    if (oldData) {
        try {
            const data = JSON.parse(oldData);
            if (data.className && data.students) {
                saveClass(data.className, data.students);
                localStorage.removeItem('pairMakerData');
            }
        } catch (error) {
            console.log('レガシーデータの移行に失敗しました。');
        }
    }
}

function updateStudentCount(count) {
    document.getElementById('countNumber').textContent = count;
    document.getElementById('studentCount').style.display = 'block';
}

function createPairs() {
    const studentList = document.getElementById('studentList').value.trim();
    const className = document.getElementById('className').value.trim();
    
    if (!studentList) {
        alert('生徒名簿を入力してください。');
        return;
    }
    
    const students = studentList.split('\n').filter(name => name.trim() !== '').map(name => name.trim());
    
    if (students.length < 2) {
        alert('ペアを作成するには最低2名の生徒が必要です。');
        return;
    }
    
    const shuffledStudents = students.slice().sort(() => Math.random() - 0.5);
    const pairs = [];
    
    for (let i = 0; i < shuffledStudents.length; i += 2) {
        if (i + 1 < shuffledStudents.length) {
            pairs.push([shuffledStudents[i], shuffledStudents[i + 1]]);
        } else {
            pairs.push([shuffledStudents[i], '（1人）']);
        }
    }
    
    displayPairs(pairs, className || 'クラス');
}

function displayPairs(pairs, className) {
    const resultsDiv = document.getElementById('pairResults');
    
    let html = '<div class="classroom-layout">';
    html += '<div class="blackboard" onclick="createPairsManual()" style="cursor: pointer;">';
    html += '<span class="blackboard-text">黒板（クリックでペア再作成）</span>';
    html += '</div>';
    html += '<div class="classroom-grid">';
    
    pairs.forEach(function(pair, index) {
        html += '<div class="desk-pair">';
        html += '<div class="student-name">' + pair[0] + '</div>';
        if (pair[1] !== '（1人）') {
            html += '<div class="student-name">' + pair[1] + '</div>';
        } else {
            html += '<div class="student-name empty">空席</div>';
        }
        html += '</div>';
    });
    
    html += '</div>';
    html += '</div>';
    
    resultsDiv.innerHTML = html;
}

// Absence Management Functions
function openAbsenceModal(className) {
    const classes = getAllClasses();
    if (!classes[className]) return;
    
    currentAbsenceClass = className;
    document.getElementById('absenceClassName').textContent = className + 'の欠席管理';
    
    const studentList = document.getElementById('absenceStudentList');
    let html = '';
    
    classes[className].students.forEach(function(student, index) {
        html += '<div class="absence-student-item">';
        html += '<input type="checkbox" id="absent_' + index + '" value="' + student + '">';
        html += '<label for="absent_' + index + '">' + student + '</label>';
        html += '</div>';
    });
    
    studentList.innerHTML = html;
    document.getElementById('absenceModal').style.display = 'block';
}

function closeAbsenceModal() {
    document.getElementById('absenceModal').style.display = 'none';
    // Don't clear currentAbsenceClass here - keep it for future pair generation
    
    // Clear all checkboxes
    const checkboxes = document.querySelectorAll('#absenceStudentList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

function createPairsWithAbsences() {
    if (!currentAbsenceClass) return;
    
    const classes = getAllClasses();
    if (!classes[currentAbsenceClass]) return;
    
    // Get absent students
    const checkboxes = document.querySelectorAll('#absenceStudentList input[type="checkbox"]:checked');
    const absentStudents = Array.from(checkboxes).map(checkbox => checkbox.value);
    
    // Store absent students and class globally for future use
    currentAbsentStudents = absentStudents;
    // currentAbsenceClass is already set in openAbsenceModal, keep it
    
    // Filter out absent students from the class
    const presentStudents = classes[currentAbsenceClass].students.filter(student => 
        !absentStudents.includes(student)
    );
    
    if (presentStudents.length < 2) {
        alert('出席者が2名未満のため、ペアを作成できません。');
        return;
    }
    
    // Create pairs with present students only
    createPairsForClass(currentAbsenceClass, presentStudents);
    
    // Close modal and switch to pair screen
    closeAbsenceModal();
    showScreen('pair');
    
    // Update the class selector to show the current class
    document.getElementById('classSelectorMain').value = currentAbsenceClass;
}

// Initialize
window.onload = function() {
    migrateLegacyData();
    updateClassSelectorMain();
    
    const classes = getAllClasses();
    if (Object.keys(classes).length > 0) {
        const firstClassName = Object.keys(classes)[0];
        const firstClass = classes[firstClassName];
        // For management screen compatibility
        if (document.getElementById('countNumber')) {
            updateStudentCount(firstClass.students.length);
        }
    }
    
    // Close modal when clicking outside of it
    window.onclick = function(event) {
        const modal = document.getElementById('absenceModal');
        if (event.target === modal) {
            closeAbsenceModal();
        }
    };
};