 document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const todoInput = document.getElementById('todo-input');
            const addBtn = document.getElementById('add-btn');
            const todoList = document.getElementById('todo-list');
            const emptyState = document.getElementById('empty-state');
            const filterBtns = document.querySelectorAll('.filter-btn');
            const clearCompletedBtn = document.getElementById('clear-completed');
            const totalTodosEl = document.getElementById('total-todos');
            const completedTodosEl = document.getElementById('completed-todos');
            const pendingTodosEl = document.getElementById('pending-todos');
            const currentDateEl = document.getElementById('current-date');
            
            // Set current date
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            currentDateEl.textContent = now.toLocaleDateString('en-US', options);
            
            // Initialize todos array
            let todos = JSON.parse(localStorage.getItem('todos')) || [];
            let currentFilter = 'all';
            
            // Initialize the app
            renderTodos();
            updateStats();
            
            // Event Listeners
            addBtn.addEventListener('click', addTodo);
            todoInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') addTodo();
            });
            
            clearCompletedBtn.addEventListener('click', clearCompleted);
            
            // Filter buttons
            filterBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentFilter = this.dataset.filter;
                    renderTodos();
                });
            });
            
            // Functions
            function addTodo() {
                const text = todoInput.value.trim();
                if (text === '') {
                    shakeInput();
                    return;
                }
                
                const newTodo = {
                    id: Date.now(),
                    text: text,
                    completed: false,
                    priority: false,
                    createdAt: new Date().toISOString()
                };
                
                todos.unshift(newTodo);
                saveTodos();
                renderTodos();
                updateStats();
                
                // Clear input and focus
                todoInput.value = '';
                todoInput.focus();
                
                // Show success animation
                addBtn.innerHTML = '<i class="fas fa-check"></i> Added!';
                addBtn.style.background = 'var(--secondary)';
                setTimeout(() => {
                    addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
                    addBtn.style.background = '';
                }, 1000);
            }
            
            function toggleTodo(id) {
                const todo = todos.find(t => t.id === id);
                if (todo) {
                    todo.completed = !todo.completed;
                    saveTodos();
                    renderTodos();
                    updateStats();
                    
                    // Add completion animation
                    const todoItem = document.querySelector(`[data-id="${id}"]`);
                    if (todoItem) {
                        todoItem.classList.add('completed');
                        setTimeout(() => {
                            todoItem.classList.remove('completed');
                        }, 500);
                    }
                }
            }
            
            function togglePriority(id) {
                const todo = todos.find(t => t.id === id);
                if (todo) {
                    todo.priority = !todo.priority;
                    saveTodos();
                    renderTodos();
                }
            }
            
            function deleteTodo(id) {
                const todoItem = document.querySelector(`[data-id="${id}"]`);
                if (todoItem) {
                    todoItem.classList.add('deleting');
                    setTimeout(() => {
                        todos = todos.filter(t => t.id !== id);
                        saveTodos();
                        renderTodos();
                        updateStats();
                    }, 400);
                }
            }
            
            function editTodo(id) {
                const todo = todos.find(t => t.id === id);
                if (!todo) return;
                
                const todoItem = document.querySelector(`[data-id="${id}"]`);
                const todoText = todoItem.querySelector('.todo-text');
                
                const currentText = todo.text;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentText;
                input.className = 'edit-input';
                
                todoText.replaceWith(input);
                input.focus();
                input.select();
                
                function saveEdit() {
                    const newText = input.value.trim();
                    if (newText && newText !== currentText) {
                        todo.text = newText;
                        saveTodos();
                    }
                    
                    renderTodos();
                }
                
                input.addEventListener('blur', saveEdit);
                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') saveEdit();
                });
            }
            
            function clearCompleted() {
                const completedCount = todos.filter(t => t.completed).length;
                if (completedCount === 0) return;
                
                // Animation for clearing
                const completedItems = document.querySelectorAll('.todo-item.completed');
                completedItems.forEach((item, index) => {
                    setTimeout(() => {
                        item.classList.add('deleting');
                    }, index * 100);
                });
                
                setTimeout(() => {
                    todos = todos.filter(t => !t.completed);
                    saveTodos();
                    renderTodos();
                    updateStats();
                }, completedItems.length * 100);
            }
            
            function renderTodos() {
                // Filter todos based on current filter
                let filteredTodos = [...todos];
                
                if (currentFilter === 'active') {
                    filteredTodos = todos.filter(t => !t.completed);
                } else if (currentFilter === 'completed') {
                    filteredTodos = todos.filter(t => t.completed);
                } else if (currentFilter === 'priority') {
                    filteredTodos = todos.filter(t => t.priority);
                }
                
                // Hide/show empty state
                if (filteredTodos.length === 0) {
                    emptyState.style.display = 'block';
                } else {
                    emptyState.style.display = 'none';
                }
                
                // Render todos
                todoList.innerHTML = '';
                
                filteredTodos.forEach(todo => {
                    const li = document.createElement('li');
                    li.className = `todo-item ${todo.completed ? 'completed' : ''} ${todo.priority ? 'priority' : ''}`;
                    li.dataset.id = todo.id;
                    
                    // Add priority indicator
                    if (todo.priority) {
                        li.style.borderLeft = '5px solid var(--warning)';
                    }
                    
                    li.innerHTML = `
                        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                        <span class="todo-text">${todo.text}</span>
                        <div class="todo-actions">
                            <button class="todo-btn edit-btn" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="todo-btn priority-btn ${todo.priority ? 'active' : ''}" title="${todo.priority ? 'Remove priority' : 'Mark as priority'}" style="background: ${todo.priority ? 'var(--warning)' : 'var(--gray)'}">
                                <i class="fas ${todo.priority ? 'fa-star' : 'fa-star'}"></i>
                            </button>
                            <button class="todo-btn delete-btn" title="Delete">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    `;
                    
                    // Add event listeners to the buttons
                    const checkbox = li.querySelector('.todo-checkbox');
                    const editBtn = li.querySelector('.edit-btn');
                    const priorityBtn = li.querySelector('.priority-btn');
                    const deleteBtn = li.querySelector('.delete-btn');
                    
                    checkbox.addEventListener('change', () => toggleTodo(todo.id));
                    editBtn.addEventListener('click', () => editTodo(todo.id));
                    priorityBtn.addEventListener('click', () => togglePriority(todo.id));
                    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
                    
                    // Double-click to edit
                    li.addEventListener('dblclick', () => editTodo(todo.id));
                    
                    todoList.appendChild(li);
                });
            }
            
            function updateStats() {
                const total = todos.length;
                const completed = todos.filter(t => t.completed).length;
                const pending = total - completed;
                
                totalTodosEl.textContent = total;
                completedTodosEl.textContent = completed;
                pendingTodosEl.textContent = pending;
                
                // Animate the numbers
                animateValue(totalTodosEl, parseInt(totalTodosEl.textContent), total);
                animateValue(completedTodosEl, parseInt(completedTodosEl.textContent), completed);
                animateValue(pendingTodosEl, parseInt(pendingTodosEl.textContent), pending);
            }
            
            function animateValue(element, start, end) {
                const duration = 500;
                const range = end - start;
                const startTime = Date.now();
                
                function updateNumber() {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Easing function
                    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                    const current = Math.floor(start + range * easeOutQuart);
                    
                    element.textContent = current;
                    
                    if (progress < 1) {
                        requestAnimationFrame(updateNumber);
                    }
                }
                
                updateNumber();
            }
            
            function saveTodos() {
                localStorage.setItem('todos', JSON.stringify(todos));
            }
            
            function shakeInput() {
                todoInput.style.transform = 'translateX(10px)';
                setTimeout(() => {
                    todoInput.style.transform = 'translateX(-10px)';
                    setTimeout(() => {
                        todoInput.style.transform = 'translateX(0)';
                    }, 100);
                }, 100);
            }
            
            // Add some sample todos on first load
            if (todos.length === 0) {
                const sampleTodos = [
                    { id: 1, text: 'Welcome to NeonFlow Todo!', completed: true, priority: true, createdAt: new Date().toISOString() },
                    { id: 2, text: 'Click the checkbox to mark complete', completed: false, priority: true, createdAt: new Date().toISOString() },
                    { id: 3, text: 'Click the star to mark as priority', completed: false, priority: false, createdAt: new Date().toISOString() },
                    { id: 4, text: 'Double-click a task to edit it', completed: false, priority: false, createdAt: new Date().toISOString() },
                    { id: 5, text: 'Use the filter buttons to view different tasks', completed: false, priority: false, createdAt: new Date().toISOString() }
                ];
                
                todos = sampleTodos;
                saveTodos();
                renderTodos();
                updateStats();
            }
        });
