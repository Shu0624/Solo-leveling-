import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Square, Plus, Trash2, ListChecks } from 'lucide-react';

const TaskChecklist = () => {
  const { api } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/dashboard/tasks');
      setTasks(res.data || []);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      const res = await api.post('/dashboard/tasks', { text: newTask.trim() });
      setTasks(prev => [...prev, res.data]);
      setNewTask('');
    } catch (err) {
      console.error('Failed to add task', err);
    }
  };

  const toggleTask = async (taskId) => {
    try {
      const res = await api.put(`/dashboard/tasks/${taskId}`);
      setTasks(prev => prev.map(t => t._id === taskId ? res.data : t));
    } catch (err) {
      console.error('Failed to toggle task', err);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/dashboard/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <section className="glass-morphism rounded-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <ListChecks className="text-emerald-500" size={20} /> Daily Tasks
        </h2>
        {tasks.length > 0 && (
          <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
            {completedCount}/{tasks.length}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / tasks.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2 mb-4 max-h-[240px] overflow-y-auto">
        <AnimatePresence>
          {tasks.length === 0 && !loading ? (
            <div className="py-6 text-center text-muted-foreground text-sm border border-dashed border-border rounded-md">
              No tasks for today. Add one below!
            </div>
          ) : (
            tasks.map((task) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10, height: 0 }}
                className="group flex items-center gap-3 p-3 rounded-md bg-background/50 border border-border/50 hover:border-border transition-colors"
              >
                <button
                  onClick={() => toggleTask(task._id)}
                  className="flex-shrink-0 text-muted-foreground hover:text-emerald-500 transition-colors"
                >
                  {task.completed ? (
                    <CheckSquare size={18} className="text-emerald-500" />
                  ) : (
                    <Square size={18} />
                  )}
                </button>
                <span
                  className={`flex-1 text-sm transition-all duration-300 ${
                    task.completed
                      ? 'line-through text-muted-foreground/50'
                      : 'text-foreground'
                  }`}
                >
                  {task.text}
                </span>
                <button
                  onClick={() => deleteTask(task._id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Add task form */}
      <form onSubmit={addTask} className="flex gap-2">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 bg-background/50 border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        <button
          type="submit"
          disabled={!newTask.trim()}
          className="p-2.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 transition-all shadow-sm"
        >
          <Plus size={18} />
        </button>
      </form>
    </section>
  );
};

export default TaskChecklist;
