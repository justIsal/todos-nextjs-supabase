'use client';

import { useState } from 'react';
import { Plus, Check, X, Edit2, Trash2, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Dashboard({ user, initialTodos }) {
  const [todos, setTodos] = useState(initialTodos);
  const [newTodo, setNewTodo] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // API call untuk menambah todo
  const addTodo = async () => {
    if (!newTodo.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/v1.0.0/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task: newTodo }),
      });

      if (response.ok) {
        const { todo } = await response.json();
        setTodos([todo, ...todos]);
        setNewTodo('');
      } else {
        console.error('Failed to add todo');
      }
    } catch (error) {
      console.error('Error adding todo:', error);
    }
    setLoading(false);
  };

  // API call untuk toggle todo
  const toggleTodo = async (id) => {
    try {
      const response = await fetch(`/api/v1.0.0/todos/toggle/${id}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        const { todo } = await response.json();
        setTodos(todos.map((t) => (t.id === id ? todo : t)));
      } else {
        console.error('Failed to toggle todo');
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  // API call untuk hapus todo
  const deleteTodo = async (id) => {
    try {
      const response = await fetch(`/api/v1.0.0/todos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTodos(todos.filter((todo) => todo.id !== id));
      } else {
        console.error('Failed to delete todo');
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditingText(todo.task || todo.title || '');
  };

  // API call untuk update todo
  const saveEdit = async () => {
    if (!editingText.trim()) return;

    try {
      const response = await fetch(`/api/v1.0.0/todos/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task: editingText }),
      });

      if (response.ok) {
        const { todo } = await response.json();
        setTodos(todos.map((t) => (t.id === editingId ? todo : t)));
        setEditingId(null);
        setEditingText('');
      } else {
        console.error('Failed to update todo');
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/v1.0.0/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <User size={16} />
                <span>{user?.nama || user?.name || 'User'}</span>
              </div>

              <button
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={handleLogout}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Welcome back!
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            You&apos;re logged in as{' '}
            <span className="font-medium">{user?.nama || user?.name || 'User'}</span>
          </p>
        </div>

        {/* Todo Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Todo List</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {todos.filter((todo) => !todo.completed).length} of {todos.length} remaining
            </span>
          </div>

          {/* Add Todo */}
          <div className="flex space-x-2 mb-6">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && addTodo()}
              placeholder="Add a new todo..."
              disabled={loading}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
            />
            <button
              onClick={addTodo}
              disabled={loading || !newTodo.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>{loading ? 'Adding...' : 'Add'}</span>
            </button>
          </div>

          {/* Todo List */}
          <div className="space-y-2">
            {todos.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No todos yet. Add one above to get started!
              </div>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      todo.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 dark:border-gray-500 hover:border-green-500'
                    }`}
                  >
                    {todo.completed && <Check size={12} />}
                  </button>

                  {editingId === todo.id ? (
                    <div className="flex-1 flex space-x-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={saveEdit}
                        className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span
                        className={`flex-1 text-gray-900 dark:text-gray-100 ${
                          todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''
                        }`}
                      >
                        {todo.task || todo.title || `Todo ${todo.id}`}
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 flex space-x-1 transition-opacity">
                        <button
                          onClick={() => startEditing(todo)}
                          className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Stats */}
          {todos.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Total: {todos.length}</span>
                <span>Completed: {todos.filter((todo) => todo.completed).length}</span>
                <span>Remaining: {todos.filter((todo) => !todo.completed).length}</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
