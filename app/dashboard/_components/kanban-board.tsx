'use client';

import { useEffect, useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { TASK_STATUSES, type TaskActionResult, type TaskStatusValue, type TaskView } from '../../../lib/dashboard-types';
import { Icon, PriorityBadge, formatDate, initials, statusLabels } from './ui';

export type KanbanBoardProps = {
  tasks: TaskView[];
  onMove: (taskId: string, status: TaskStatusValue) => Promise<TaskActionResult>;
};

export function KanbanBoard({ tasks: serverTasks, onMove }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(serverTasks);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const pending = useRef(false);
  const latestServerTasks = useRef(serverTasks);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    latestServerTasks.current = serverTasks;
    if (!pending.current) setTasks(serverTasks);
  }, [serverTasks]);

  async function moveTask(taskId: string, status: TaskStatusValue) {
    if (pending.current) return;
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status === status) return;
    const previous = tasks;
    const serverSnapshot = latestServerTasks.current;
    pending.current = true;
    setPendingId(taskId);
    setError('');
    setMessage(`Saving “${task.title}” to ${statusLabels[status]}…`);
    // Update the column immediately; persistence happens after the visual move.
    setTasks((items) => items.map((item) => item.id === taskId ? { ...item, status } : item));
    try {
      const result = await onMove(taskId, status);
      if (!result.ok) throw new Error(result.error);
      // Revalidation may deliver new props while the action is in flight.
      setTasks((items) => (latestServerTasks.current === serverSnapshot ? items : latestServerTasks.current).map((item) => item.id === taskId ? { ...item, status } : item));
      setMessage(`“${task.title}” moved to ${statusLabels[status]}.`);
    } catch (cause) {
      setTasks(latestServerTasks.current === serverSnapshot ? previous : latestServerTasks.current);
      setMessage('');
      setError(cause instanceof Error ? `${cause.message} Your move was undone. Try again.` : 'Unable to save your change. Your move was undone. Try again.');
    } finally {
      pending.current = false;
      setPendingId(null);
    }
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination || result.reason === 'CANCEL' || result.source.droppableId === result.destination.droppableId) return;
    const status = TASK_STATUSES.find((value) => value === result.destination?.droppableId);
    if (status) void moveTask(result.draggableId, status);
  }

  if (!mounted) return <div className="grid gap-5 md:grid-cols-3" role="status" aria-label="Loading task board">{TASK_STATUSES.map((status) => <div key={status} className="h-72 animate-pulse rounded-lg bg-[#e8ecdf]" />)}</div>;

  return <section aria-label="Project task board"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-semibold">Task board</h2><p className="mt-1 text-xs leading-5 text-[#687364]">Drag a task to change its status, or use its status menu.</p></div><p className="text-[11px] text-[#687364]">Space to lift · Arrow keys to move · Space to drop</p></div>
    <div className="mb-4 min-h-5 text-xs" aria-live="polite" aria-atomic="true">{error ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-900">{error}</p> : <p className={pendingId ? 'text-amber-900' : 'text-emerald-800'}>{message}</p>}</div>
    <DragDropContext onDragEnd={onDragEnd}><div className="grid items-start gap-5 md:grid-cols-3">{TASK_STATUSES.map((status) => {
      const columnTasks = tasks.filter((task) => task.status === status);
      return <section key={status} aria-label={`${statusLabels[status]} tasks`} className="min-w-0 rounded-lg border border-[#dce3d2] bg-[#eef2e7] p-3"><div className="mb-3 flex items-center justify-between gap-3 px-1 py-2"><h3 className="flex items-center gap-2 text-xs font-semibold"><span className={`h-2 w-2 rounded-full ${status === 'DONE' ? 'bg-emerald-600' : status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-[#88977c]'}`} />{statusLabels[status]}</h3><span className="rounded bg-white px-2 py-0.5 text-[11px] font-medium tabular-nums text-[#617054]">{columnTasks.length}</span></div><Droppable droppableId={status} isDropDisabled={Boolean(pendingId)}>{(provided, snapshot) => <div ref={provided.innerRef} {...provided.droppableProps} className={`min-h-48 rounded-md transition-colors ${snapshot.isDraggingOver ? 'bg-[#dce8d1]' : ''}`}>
        {columnTasks.map((task, index) => <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={Boolean(pendingId)}>{(drag, dragState) => <article ref={drag.innerRef} {...drag.draggableProps} style={drag.draggableProps.style} className={`mb-3 min-w-0 rounded-md border bg-white p-4 ${dragState.isDragging ? 'border-emerald-700 shadow-xl' : 'border-[#dde4d4] shadow-sm'} ${pendingId === task.id ? 'opacity-70' : ''}`} aria-busy={pendingId === task.id}>
          <div className="mb-3 flex items-center justify-between gap-2"><PriorityBadge priority={task.priority} /><span {...drag.dragHandleProps} aria-label={`Move task: ${task.title}`} className={`rounded p-1 text-[#7d8b70] hover:bg-[#edf2e6] ${pendingId ? 'cursor-wait' : 'cursor-grab active:cursor-grabbing'}`}><Icon name="grip" className="h-4 w-4" /></span></div>
          <h4 className="break-words text-sm font-semibold leading-6">{task.title}</h4>{task.description && <p className="mt-2 line-clamp-3 break-words text-xs leading-5 text-[#6b7564]">{task.description}</p>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#eff2e9] pt-3"><span className="inline-flex items-center gap-1.5 text-[10px] text-[#687560]"><Icon name="clock" className="h-3.5 w-3.5" />{formatDate(task.dueDate)}</span>{task.assigneeName ? <span role="img" title={task.assigneeName} aria-label={`Assigned to ${task.assigneeName}`} className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e8eedf] text-[9px] font-semibold text-[#506742]">{initials(task.assigneeName)}</span> : <span className="text-[10px] text-[#606b58]">Unassigned</span>}</div>
          <label className="mt-3 block"><span className="sr-only">Status for {task.title}</span><select className="w-full rounded border border-[#e3e8dc] bg-[#f9faf5] px-2 py-1.5 text-[11px] text-[#596a4d] disabled:opacity-60" value={task.status} disabled={Boolean(pendingId)} onChange={(event) => void moveTask(task.id, event.target.value as TaskStatusValue)}>{TASK_STATUSES.map((value) => <option value={value} key={value}>{statusLabels[value]}</option>)}</select></label>
        </article>}</Draggable>)}{provided.placeholder}{!columnTasks.length && <p className="px-4 py-12 text-center text-xs leading-5 text-[#6e7c60]">A little breathing room.<br />Drop a task here when it’s ready.</p>}
      </div>}</Droppable></section>;
    })}</div></DragDropContext>
  </section>;
}
