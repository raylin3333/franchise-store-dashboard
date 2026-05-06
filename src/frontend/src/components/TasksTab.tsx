import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useCreateTask,
  useDeleteTask,
  useStores,
  useTasks,
  useUpdateTask,
} from "../hooks/useQueries";
import type { Task } from "../types";

// Blue palette constants
const NAVY = "#1A1A2E";
const BLUE = "#4A7CF7";
const CORNFLOWER = "#5B8DEF";
const MIST = "#4a6fa8";
const BORDER = "#DCE4F5";
const LIGHT_BG = "#F0F4FF";

const COLUMNS: { key: string; label: string; dotColor: string }[] = [
  { key: "todo", label: "To Do", dotColor: MIST },
  { key: "inprogress", label: "In Progress", dotColor: CORNFLOWER },
  { key: "done", label: "Done", dotColor: "#2ECC71" },
];

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    high: { bg: "#FFE5E5", text: "#C0392B" },
    medium: { bg: "#FFF3E0", text: "#E67E22" },
    low: { bg: "#EEF2FF", text: "#4A7CF7" },
  };
  const s = styles[priority] ?? { bg: LIGHT_BG, text: MIST };
  return (
    <span
      className="capitalize"
      style={{
        background: s.bg,
        color: s.text,
        letterSpacing: "0.06em",
        fontSize: "0.6rem",
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: "3px",
        textTransform: "uppercase",
        display: "inline-block",
      }}
    >
      {priority}
    </span>
  );
}

const INPUT_STYLE = { borderColor: BORDER, color: NAVY };

export default function TasksTab() {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: stores = [] } = useStores();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    storeId: "",
    priority: "medium",
    dueDate: "",
  });

  const storeMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const s of stores) m[s.id] = s.name;
    return m;
  }, [stores]);

  const columns = useMemo(() => {
    const map: Record<string, Task[]> = { todo: [], inprogress: [], done: [] };
    for (const t of tasks) {
      const key = t.status in map ? t.status : "todo";
      map[key].push(t);
    }
    return map;
  }, [tasks]);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.storeId) {
      toast.error("Please select a store");
      return;
    }
    try {
      await createTask.mutateAsync(form);
      toast.success("Task created");
      setCreateOpen(false);
      setForm({
        title: "",
        description: "",
        storeId: "",
        priority: "medium",
        dueDate: "",
      });
    } catch {
      toast.error("Failed to create task");
    }
  };

  const handleEdit = async () => {
    if (!editTask) return;
    try {
      await updateTask.mutateAsync({ taskId: editTask.id, task: editTask });
      toast.success("Task updated");
      setEditTask(null);
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async (taskId: bigint) => {
    try {
      await deleteTask.mutateAsync(taskId);
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        task: { ...task, status: newStatus },
      });
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div
      className="flex flex-col min-h-0"
      style={{
        background: "transparent",
        flex: 1,
        overflow: "hidden",
        padding: "16px",
      }}
    >
      {/* Header */}
      <div
        className="flex items-start sm:items-end justify-between border-b pb-4 md:pb-5 shrink-0 gap-3 flex-wrap"
        style={{ borderColor: BORDER }}
      >
        <div>
          <p
            className="text-xs font-medium tracking-widest uppercase mb-1"
            style={{ color: MIST, letterSpacing: "0.12em" }}
          >
            Administration
          </p>
          <h2
            className="font-display text-2xl font-semibold"
            style={{ color: NAVY }}
          >
            Task Manager
          </h2>
          <p className="text-xs mt-1" style={{ color: MIST }}>
            {tasks.length} total task{tasks.length !== 1 ? "s" : ""} across all
            stores
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="tasks.open_modal_button"
              size="sm"
              className="flex items-center gap-1.5 text-xs h-9 px-4 rounded-lg"
              style={{ background: BLUE, color: "#FFFFFF", border: "none" }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent
            data-ocid="tasks.dialog"
            className="w-[calc(100vw-32px)] max-w-md rounded-2xl"
            style={{ background: "#FFFFFF", borderColor: BORDER }}
          >
            <DialogHeader>
              <DialogTitle
                className="font-display text-lg font-semibold"
                style={{ color: NAVY }}
              >
                Create New Task
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <FormField label="Title *">
                <Input
                  data-ocid="tasks.title.input"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="Task title"
                  className="h-9 text-sm rounded-lg border"
                  style={INPUT_STYLE}
                />
              </FormField>
              <FormField label="Description">
                <Textarea
                  data-ocid="tasks.description.textarea"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Optional description"
                  rows={2}
                  className="text-sm resize-none rounded-lg border"
                  style={INPUT_STYLE}
                />
              </FormField>
              <FormField label="Store *">
                <Select
                  value={form.storeId}
                  onValueChange={(v) => setForm((p) => ({ ...p, storeId: v }))}
                >
                  <SelectTrigger
                    data-ocid="tasks.store.select"
                    className="h-9 text-sm rounded-lg border"
                    style={INPUT_STYLE}
                  >
                    <SelectValue placeholder="Select a store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Priority">
                  <Select
                    value={form.priority}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, priority: v }))
                    }
                  >
                    <SelectTrigger
                      data-ocid="tasks.priority.select"
                      className="h-9 text-sm rounded-lg border"
                      style={INPUT_STYLE}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Due Date">
                  <Input
                    data-ocid="tasks.duedate.input"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, dueDate: e.target.value }))
                    }
                    className="h-9 text-sm rounded-lg border"
                    style={INPUT_STYLE}
                  />
                </FormField>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                data-ocid="tasks.cancel_button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg border text-xs"
                style={{ borderColor: BORDER, color: MIST }}
              >
                Cancel
              </Button>
              <Button
                data-ocid="tasks.submit_button"
                size="sm"
                onClick={handleCreate}
                disabled={createTask.isPending}
                className="rounded-lg text-xs"
                style={{ background: BLUE, color: "#FFFFFF" }}
              >
                {createTask.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : null}
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      {tasksLoading ? (
        <div
          data-ocid="tasks.loading_state"
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5"
          style={{ flex: 1, minHeight: 0, paddingTop: "16px" }}
        >
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="rounded-2xl"
              style={{ minHeight: 200 }}
            />
          ))}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5"
          style={{
            flex: 1,
            minHeight: 0,
            paddingTop: "16px",
            overflow: "hidden",
          }}
        >
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.key}
              col={col}
              tasks={columns[col.key] ?? []}
              storeMap={storeMap}
              onEdit={(task) => setEditTask({ ...task })}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              isDeleting={deleteTask.isPending}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTask} onOpenChange={(o) => !o && setEditTask(null)}>
        <DialogContent
          data-ocid="tasks.edit.dialog"
          className="w-[calc(100vw-32px)] max-w-md rounded-2xl"
          style={{ background: "#FFFFFF", borderColor: BORDER }}
        >
          <DialogHeader>
            <DialogTitle
              className="font-display text-lg font-semibold"
              style={{ color: NAVY }}
            >
              Edit Task
            </DialogTitle>
          </DialogHeader>
          {editTask && (
            <div className="space-y-4 py-2">
              <FormField label="Title">
                <Input
                  data-ocid="tasks.edit.title.input"
                  value={editTask.title}
                  onChange={(e) =>
                    setEditTask((p) =>
                      p ? { ...p, title: e.target.value } : p,
                    )
                  }
                  className="h-9 text-sm rounded-lg border"
                  style={INPUT_STYLE}
                />
              </FormField>
              <FormField label="Description">
                <Textarea
                  data-ocid="tasks.edit.description.textarea"
                  value={editTask.description}
                  onChange={(e) =>
                    setEditTask((p) =>
                      p ? { ...p, description: e.target.value } : p,
                    )
                  }
                  rows={2}
                  className="text-sm resize-none rounded-lg border"
                  style={INPUT_STYLE}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Priority">
                  <Select
                    value={editTask.priority}
                    onValueChange={(v) =>
                      setEditTask((p) => (p ? { ...p, priority: v } : p))
                    }
                  >
                    <SelectTrigger
                      data-ocid="tasks.edit.priority.select"
                      className="h-9 text-sm rounded-lg border"
                      style={INPUT_STYLE}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Status">
                  <Select
                    value={editTask.status}
                    onValueChange={(v) =>
                      setEditTask((p) => (p ? { ...p, status: v } : p))
                    }
                  >
                    <SelectTrigger
                      data-ocid="tasks.edit.status.select"
                      className="h-9 text-sm rounded-lg border"
                      style={INPUT_STYLE}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="inprogress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              <FormField label="Due Date">
                <Input
                  data-ocid="tasks.edit.duedate.input"
                  type="date"
                  value={editTask.dueDate}
                  onChange={(e) =>
                    setEditTask((p) =>
                      p ? { ...p, dueDate: e.target.value } : p,
                    )
                  }
                  className="h-9 text-sm rounded-lg border"
                  style={INPUT_STYLE}
                />
              </FormField>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              data-ocid="tasks.edit.cancel_button"
              onClick={() => setEditTask(null)}
              className="rounded-lg border text-xs"
              style={{ borderColor: BORDER, color: MIST }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="tasks.edit.save_button"
              size="sm"
              onClick={handleEdit}
              disabled={updateTask.isPending}
              className="rounded-lg text-xs"
              style={{ background: BLUE, color: "#FFFFFF" }}
            >
              {updateTask.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── KanbanColumn ── extracted to keep flex-height chain clean
function KanbanColumn({
  col,
  tasks,
  storeMap,
  onEdit,
  onDelete,
  onStatusChange,
  isDeleting,
}: {
  col: { key: string; label: string; dotColor: string };
  tasks: Task[];
  storeMap: Record<string, string>;
  onEdit: (task: Task) => void;
  onDelete: (taskId: bigint) => void;
  onStatusChange: (task: Task, s: string) => void;
  isDeleting: boolean;
}) {
  return (
    // Plain div — NOT OrnamentalCard (overflow:visible breaks flex height)
    // Uses same visual styling as OrnamentalCard panels
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        borderRadius: "16px",
        background: "#FFFFFF",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 1px 6px rgba(74,108,248,0.06)",
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 border-b shrink-0"
        style={{
          borderColor: BORDER,
          background: LIGHT_BG,
          borderRadius: "16px 16px 0 0",
        }}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: col.dotColor }}
        />
        <span
          className="font-display text-sm font-semibold tracking-wide flex-1"
          style={{ color: NAVY }}
        >
          {col.label}
        </span>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: "#FFFFFF",
            color: MIST,
            border: `1px solid ${BORDER}`,
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Scrollable task list — flex-1 with native overflow scroll */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {tasks.length === 0 ? (
          <div
            data-ocid={`tasks.${col.key}.empty_state`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              minHeight: "80px",
              borderRadius: "12px",
              border: `2px dashed ${BORDER}`,
            }}
          >
            <p
              style={{
                color: MIST,
                opacity: 0.7,
                fontSize: "0.65rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              No tasks
            </p>
          </div>
        ) : (
          tasks.map((task, i) => (
            <TaskCard
              key={String(task.id)}
              task={task}
              index={i + 1}
              storeName={storeMap[task.storeId]}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task.id)}
              onStatusChange={(s) => onStatusChange(task, s)}
              isDeleting={isDeleting}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label
        className="text-xs font-medium tracking-wider uppercase mb-1.5 block"
        style={{ color: MIST, letterSpacing: "0.1em", fontSize: "0.65rem" }}
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

function TaskCard({
  task,
  index,
  storeName,
  onEdit,
  onDelete,
  onStatusChange,
  isDeleting,
}: {
  task: Task;
  index: number;
  storeName?: string;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: string) => void;
  isDeleting: boolean;
}) {
  return (
    <div
      data-ocid={`tasks.item.${index}`}
      style={{
        borderRadius: "12px",
        padding: "14px",
        background: "#FFFFFF",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 1px 4px rgba(74,108,248,0.07)",
        transition: "box-shadow 0.15s ease",
        flexShrink: 0,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p
          className="text-sm font-semibold leading-snug flex-1 min-w-0 break-words"
          style={{ color: NAVY, wordBreak: "break-word" }}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            data-ocid={`tasks.edit_button.${index}`}
            onClick={onEdit}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: "transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#EEF3FE";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            aria-label="Edit task"
          >
            <Pencil className="w-3 h-3" style={{ color: MIST }} />
          </button>
          <button
            type="button"
            data-ocid={`tasks.delete_button.${index}`}
            onClick={onDelete}
            disabled={isDeleting}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: "transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#FFF0F0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            aria-label="Delete task"
          >
            <Trash2 className="w-3 h-3" style={{ color: "#EF4444" }} />
          </button>
        </div>
      </div>

      {task.description ? (
        <p
          className="text-xs mb-2.5 line-clamp-2 leading-relaxed break-words"
          style={{ color: MIST, wordBreak: "break-word" }}
        >
          {task.description}
        </p>
      ) : null}

      <div className="flex items-center gap-1.5 flex-wrap">
        <PriorityBadge priority={task.priority} />
        {storeName && (
          <span
            style={{
              background: "#EEF3FE",
              color: MIST,
              letterSpacing: "0.05em",
              fontSize: "0.6rem",
              fontWeight: 500,
              padding: "2px 7px",
              borderRadius: "3px",
              textTransform: "uppercase",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "inline-block",
            }}
          >
            {storeName}
          </span>
        )}
      </div>

      {task.dueDate ? (
        <div className="flex items-center gap-1.5 mt-2.5">
          <CalendarDays className="w-3 h-3 shrink-0" style={{ color: MIST }} />
          <span className="text-[10px]" style={{ color: MIST }}>
            {task.dueDate}
          </span>
        </div>
      ) : null}

      <div className="mt-3 pt-2.5 border-t" style={{ borderColor: BORDER }}>
        <Select value={task.status} onValueChange={onStatusChange}>
          <SelectTrigger
            className="h-7 text-[10px] px-2 rounded-lg border"
            style={{ borderColor: BORDER, color: NAVY }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="inprogress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
