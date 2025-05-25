'use client';

import { useState, useRef } from 'react';
import { Plus, Check, X, Edit2, Trash2, User, LogOut, ImageIcon, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Dashboard({ user, initialTodos, token }) {
  const [todos, setTodos] = useState(initialTodos);
  const [newTodo, setNewTodo] = useState('');
  const [newTodoImage, setNewTodoImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingImage, setEditingImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [editImagePreview, setEditImagePreview] = useState('');
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const router = useRouter();

  const [toggleLoading, setToggleLoading] = useState(new Set());
  const [deleteLoading, setDeleteLoading] = useState(new Set());
  const [updateLoading, setUpdateLoading] = useState(false);

  const [toasts, setToasts] = useState([]);

  const handleImageSelect = (file) => {
    if (!file) return;

    setNewTodoImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle image file selection for editing
  const handleEditImageSelect = (file) => {
    if (!file) return;

    setEditingImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const Toast = ({ toast, onRemove }) => (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ease-in-out ${
        toast.type === 'success'
          ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200'
          : 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200'
      } animate-in slide-in-from-right-full`}
      style={{ marginTop: `${toast.index * 80}px` }}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {toast.type === 'success' ? (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
          ) : (
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <X size={14} className="text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{toast.title}</p>
          {toast.message && <p className="text-sm opacity-90 mt-1">{toast.message}</p>}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );

  const showToast = (type, title, message = '') => {
    const id = Date.now() + Math.random();
    const newToast = { id, type, title, message, index: toasts.length };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) =>
      prev.filter((toast) => toast.id !== id).map((toast, index) => ({ ...toast, index }))
    );
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('task', newTodo);

      if (newTodoImage) {
        formData.append('headerImage', newTodoImage);
      }

      const response = await fetch('/api/v1.0.0/todos', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const { todo } = await response.json();
        setTodos([todo, ...todos]);
        setNewTodo('');
        setNewTodoImage(null);
        setImagePreview('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        showToast('success', 'Todo Created!', `"${todo.task}" has been added to your list.`);
      } else {
        const errorData = await response.json();
        console.error('Failed to add todo:', errorData.error);
        showToast(
          'error',
          'Failed to Create Todo',
          errorData.error || 'Something went wrong while creating your todo.'
        );
      }
    } catch (error) {
      console.error('Error adding todo:', error);
      showToast(
        'error',
        'Network Error',
        'Unable to connect to the server. Please check your connection.'
      );
    }
    setLoading(false);
  };

  const toggleTodo = async (id) => {
    setToggleLoading((prev) => new Set([...prev, id]));
    try {
      const todo = todos.find((t) => t?.id === id);
      if (!todo) return;

      const formData = new FormData();
      formData.append('task', todo?.task);
      formData.append('is_complete', (!todo.is_complete).toString());

      const response = await fetch(`/api/v1.0.0/todos/toggle/${id}`, {
        method: 'PATCH',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const { todo: updatedTodo } = await response.json();
        setTodos(todos.map((t) => (t?.id === id ? updatedTodo : t)));
        showToast(
          'success',
          updatedTodo.is_complete ? 'Todo Completed! 🎉' : 'Todo Reopened',
          `"${updatedTodo.task}" has been ${
            updatedTodo.is_complete ? 'marked as complete' : 'reopened'
          }.`
        );
      } else {
        const errorData = await response.json();
        console.error('Failed to toggle todo:', errorData.error);
        showToast(
          'error',
          'Failed to Update Todo',
          errorData.error || 'Unable to update todo status.'
        );
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
      showToast('error', 'Network Error', 'Unable to connect to the server.');
    } finally {
      setToggleLoading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const deleteTodo = async (id) => {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    const todoToDelete = todos.find((t) => t?.id === id);
    setDeleteLoading((prev) => new Set([...prev, id]));

    try {
      const response = await fetch(`/api/v1.0.0/todos/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTodos(todos.filter((todo) => todo?.id !== id));
        showToast(
          'success',
          'Todo Deleted',
          `"${todoToDelete?.task || 'Todo'}" has been permanently removed.`
        );
      } else {
        const errorData = await response.json();
        console.error('Failed to delete todo:', errorData.error);
        showToast(
          'error',
          'Failed to Delete Todo',
          errorData.error || 'Unable to delete the todo.'
        );
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      showToast('error', 'Network Error', 'Unable to connect to the server.');
    } finally {
      setDeleteLoading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const startEditing = (todo) => {
    setEditingId(todo?.id);
    setEditingText(todo?.task || '');
    setEditingImage(null);
    setEditImagePreview('');
  };

  const saveEdit = async () => {
    if (!editingText.trim()) return;

    setUpdateLoading(true);
    try {
      const formData = new FormData();
      formData.append('task', editingText);

      if (editingImage) {
        formData.append('headerImage', editingImage);
      }

      const response = await fetch(`/api/v1.0.0/todos/${editingId}`, {
        method: 'PUT',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const { todo } = await response.json();
        setTodos(todos.map((t) => (t?.id === editingId ? todo : t)));
        setEditingId(null);
        setEditingText('');
        setEditingImage(null);
        setEditImagePreview('');
        showToast('success', 'Todo Updated! ✨', `Your changes have been saved successfully.`);
      } else {
        const errorData = await response.json();
        console.error('Failed to update todo:', errorData.error);
        showToast(
          'error',
          'Failed to Update Todo',
          errorData.error || 'Unable to save your changes.'
        );
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      showToast('error', 'Network Error', 'Unable to connect to the server.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
    setEditingImage(null);
    setEditImagePreview('');
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

  const removeImage = () => {
    setNewTodoImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeEditingImage = () => {
    setEditingImage(null);
    setEditImagePreview('');
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  const LoadingSpinner = ({ size = 16, className = '' }) => (
    <div className={`inline-block animate-spin ${className}`}>
      <div
        className={`border-2 border-current border-t-transparent rounded-full`}
        style={{ width: size, height: size }}
      />
    </div>
  );

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
                onClick={() => {
                  const confirmLogout = window.confirm('Yakin ingin logout?');
                  if (confirmLogout) {
                    handleLogout();
                  }
                }}
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
              {todos.filter((todo) => !todo?.is_complete).length} of {todos.length} remaining
            </span>
          </div>

          {/* Add Todo */}
          <div className="space-y-4 mb-6">
            <div className="flex space-x-2">
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 flex items-center space-x-2 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size={16} className="text-white" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Add Todo</span>
                  </>
                )}
              </button>
            </div>

            {/* Image Upload */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageSelect(file);
                    }
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Upload size={16} />
                  <span>Upload Image</span>
                </button>
              </div>

              {imagePreview && (
                <div className="flex items-center space-x-2">
                  <div className="relative w-12 h-12 rounded-md overflow-hidden border border-gray-200 dark:border-gray-600">
                    <Image
                      src={imagePreview || '/placeholder.svg'}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    onClick={removeImage}
                    className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Todo List */}
          <div className="space-y-3">
            {todos.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No todos yet. Add one above to get started!
              </div>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo?.id}
                  className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-md group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <button
                    onClick={() => toggleTodo(todo?.id)}
                    disabled={toggleLoading.has(todo?.id)}
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 mt-1 ${
                      todo?.is_complete
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 dark:border-gray-500 hover:border-green-500'
                    } ${toggleLoading.has(todo?.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {toggleLoading.has(todo?.id) ? (
                      <LoadingSpinner size={12} className="text-current" />
                    ) : (
                      todo?.is_complete && <Check size={12} />
                    )}
                  </button>

                  {/* Todo Image */}
                  {todo?.image_url && (
                    <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border border-gray-200 dark:border-gray-600">
                      <Image
                        src={todo?.image_url || '/placeholder.svg'}
                        alt="Todo image"
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}

                  {editingId === todo?.id ? (
                    <div className="flex-1 space-y-3">
                      <div className="flex space-x-2">
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
                          disabled={updateLoading}
                          className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {updateLoading ? (
                            <LoadingSpinner size={16} className="text-green-600" />
                          ) : (
                            <Check size={16} />
                          )}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          ref={editFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleEditImageSelect(file);
                            }
                          }}
                          className="hidden"
                        />
                        <button
                          onClick={() => editFileInputRef.current?.click()}
                          className="flex items-center space-x-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <ImageIcon size={12} />
                          <span>Change Image</span>
                        </button>

                        {(editImagePreview ||
                          (editingId === todo?.id && todo?.image_url && !editingImage)) && (
                          <>
                            <div className="relative w-8 h-8 rounded overflow-hidden border border-gray-200 dark:border-gray-600">
                              <Image
                                src={editImagePreview || todo?.image_url}
                                alt="Edit preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <button
                              onClick={removeEditingImage}
                              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                            >
                              <X size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <span
                          className={`block text-gray-900 dark:text-gray-100 ${
                            todo?.is_complete ? 'line-through text-gray-500 dark:text-gray-400' : ''
                          }`}
                        >
                          {todo?.task || `Todo ${todo?.id}`}
                        </span>
                        {todo?.image_url && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                            📷 Has image
                          </span>
                        )}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex space-x-1 transition-opacity">
                        <button
                          onClick={() => startEditing(todo)}
                          className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteTodo(todo?.id)}
                          disabled={deleteLoading.has(todo?.id)}
                          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {deleteLoading.has(todo?.id) ? (
                            <LoadingSpinner size={14} className="text-red-600" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {todos.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Total: {todos.length}</span>
                <span>Complete: {todos.filter((todo) => todo?.is_complete).length}</span>
                <span>Remaining: {todos.filter((todo) => !todo?.is_complete).length}</span>
                <span>With Images: {todos.filter((todo) => todo?.image_url).length}</span>
              </div>
            </div>
          )}
        </div>
      </main>
      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
