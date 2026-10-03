import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Briefcase,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Filter,
  Search,
  Check,
  X,
  FileText,
  UserPlus,
  ArrowRight,
} from 'lucide-react';
import {
  CommunityServiceProject,
  ProjectTask,
  ProjectTaskPriority,
  ProjectTaskStatus,
} from '../types';

export const ProjectsScreen: React.FC = () => {
  const {
    projects,
    addProject,
    addTaskToProject,
    updateTaskStatus,
    joinProjectVolunteer,
    updateProjectStatus,
    currentUser,
    allMembers,
  } = useApp();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('all');
  const [taskFilterPriority, setTaskFilterPriority] = useState<string>('all');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isAccomplishmentReportOpen, setIsAccomplishmentReportOpen] = useState(false);

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState(currentUser.id);
  const [taskPriority, setTaskPriority] = useState<ProjectTaskPriority>('Medium');
  const [taskDueDate, setTaskDueDate] = useState('2026-10-15');

  // New project form state
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState<any>('Health & Medical');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectDate, setNewProjectDate] = useState('2026-11-15');
  const [newProjectLocation, setNewProjectLocation] = useState('Daet, Camarines Norte');
  const [newProjectBeneficiaries, setNewProjectBeneficiaries] = useState('');
  const [newProjectBeneficiaryCount, setNewProjectBeneficiaryCount] = useState<number>(300);
  const [newProjectBudget, setNewProjectBudget] = useState<number>(50000);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Filtering tasks
  const filteredTasks = selectedProject
    ? selectedProject.tasks.filter((t) => {
        if (taskFilterStatus !== 'all' && t.status !== taskFilterStatus) return false;
        if (taskFilterPriority !== 'all' && t.priority !== taskFilterPriority) return false;
        return true;
      })
    : [];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedProject) return;

    const assignee = allMembers.find((m) => m.id === taskAssigneeId);

    addTaskToProject(selectedProject.id, {
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      assigneeId: taskAssigneeId,
      assigneeName: assignee ? `${assignee.firstName} ${assignee.lastName}` : undefined,
      assigneeNickname: assignee?.nickname,
      assigneePhoto: assignee?.profilePhoto,
      priority: taskPriority,
      dueDate: taskDueDate,
      status: 'To Do',
    });

    setTaskTitle('');
    setTaskDescription('');
    setIsNewTaskModalOpen(false);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    addProject({
      clubId: 'club-beec',
      title: newProjectTitle.trim(),
      description: newProjectDescription.trim() || 'Community service outreach by Bantayog Elite Eagles Club.',
      category: newProjectCategory,
      date: newProjectDate,
      location: newProjectLocation,
      beneficiaries: newProjectBeneficiaries || 'Camarines Norte residents',
      beneficiaryCount: Number(newProjectBeneficiaryCount) || 100,
      budget: Number(newProjectBudget) || 10000,
      actualExpense: 0,
      status: 'Planning',
      projectLeadId: currentUser.id,
      projectLeadName: `${currentUser.gender === 'Female' ? 'Ate' : 'Kuya'} ${currentUser.nickname} ${currentUser.lastName}`,
      photos: ['https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80'],
      sponsors: ['Bantayog Elite Eagles Club'],
    });

    setIsNewProjectModalOpen(false);
    setNewProjectTitle('');
  };

  const isUserVolunteer = selectedProject?.volunteers.some((v) => v.memberId === currentUser.id);

  // Status badge colors
  const getPriorityBadge = (priority: ProjectTaskPriority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
      case 'High':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Medium':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Low':
        return 'bg-slate-700/40 text-slate-300 border-slate-600';
    }
  };

  const getStatusBadge = (status: ProjectTaskStatus) => {
    switch (status) {
      case 'To Do':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'In Progress':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'In Review':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Completed':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  const nextStatus = (curr: ProjectTaskStatus): ProjectTaskStatus => {
    if (curr === 'To Do') return 'In Progress';
    if (curr === 'In Progress') return 'In Review';
    if (curr === 'In Review') return 'Completed';
    return 'Completed';
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-serif">
              Project Collaboration & Task Tracking
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Internal task management, volunteer assignments & accomplishment reporting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Mission</span>
          </button>
        </div>
      </div>

      {/* Project Selector Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {projects.map((proj) => {
          const isSelected = proj.id === selectedProject?.id;
          return (
            <button
              key={proj.id}
              onClick={() => setSelectedProjectId(proj.id)}
              className={`p-3 rounded-2xl border text-left shrink-0 max-w-xs transition ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="font-semibold text-amber-400 truncate max-w-[120px]">
                  {proj.category}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded font-bold ${
                    proj.status === 'Completed'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : proj.status === 'Ongoing'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {proj.status}
                </span>
              </div>
              <h4 className="text-xs font-bold truncate max-w-[190px]">{proj.title}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {proj.tasks.filter((t) => t.status === 'Completed').length}/{proj.tasks.length} tasks completed
              </p>
            </button>
          );
        })}
      </div>

      {selectedProject && (
        <div className="space-y-5">
          {/* Active Project Dossier */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {selectedProject.category} • {selectedProject.status}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white font-serif mt-1">
                  {selectedProject.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {!isUserVolunteer ? (
                  <button
                    onClick={() => joinProjectVolunteer(selectedProject.id, 'Eagle Volunteer')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Volunteer</span>
                  </button>
                ) : (
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Joined as Volunteer
                  </span>
                )}

                <button
                  onClick={() => setIsAccomplishmentReportOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 font-bold text-xs transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedProject.description}
            </p>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="bg-slate-850 p-2.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Beneficiaries</span>
                <span className="text-sm font-bold text-white font-mono">
                  {selectedProject.beneficiaryCount.toLocaleString()}
                </span>
              </div>

              <div className="bg-slate-850 p-2.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Budget Target</span>
                <span className="text-sm font-bold text-amber-400 font-mono">
                  ₱{selectedProject.budget.toLocaleString()}
                </span>
              </div>

              <div className="bg-slate-850 p-2.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Actual Expense</span>
                <span className="text-sm font-bold text-purple-300 font-mono">
                  ₱{selectedProject.actualExpense.toLocaleString()}
                </span>
              </div>

              <div className="bg-slate-850 p-2.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Eagle Volunteers</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {selectedProject.volunteers.length} Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Location: {selectedProject.location}</span>
              <span className="text-slate-600">•</span>
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Target Date: {selectedProject.date}</span>
            </div>
          </div>

          {/* TASK COLLABORATION WORKFLOW SECTION */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                  <span>Project Task Tracking Board</span>
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                    {selectedProject.tasks.length} Tasks
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Assign action items, track deliverables, and enforce execution deadlines
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Status filter */}
                <select
                  value={taskFilterStatus}
                  onChange={(e) => setTaskFilterStatus(e.target.value)}
                  className="bg-slate-850 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Completed">Completed</option>
                </select>

                <button
                  onClick={() => setIsNewTaskModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              </div>
            </div>

            {/* Task Kanban Columns / List */}
            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-850/50 rounded-2xl border border-slate-800">
                  No tasks found under the selected filters. Click "+ Add Task" to create one.
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl bg-slate-850 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getPriorityBadge(
                            task.priority
                          )}`}
                        >
                          {task.priority} Priority
                        </span>

                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(
                            task.status
                          )}`}
                        >
                          {task.status}
                        </span>

                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          Due: {task.dueDate}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition">
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      {/* Assignee Avatar */}
                      <div className="flex items-center gap-2">
                        {task.assigneePhoto ? (
                          <img
                            src={task.assigneePhoto}
                            alt={task.assigneeNickname || 'Assignee'}
                            className="w-7 h-7 rounded-lg object-cover border border-amber-400/40"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                            🦅
                          </div>
                        )}
                        <div className="text-left">
                          <span className="text-[11px] font-semibold text-slate-200 block truncate max-w-[100px]">
                            {task.assigneeNickname ? `Kuya ${task.assigneeNickname}` : 'Unassigned'}
                          </span>
                          <span className="text-[9px] text-slate-500 block">Assignee</span>
                        </div>
                      </div>

                      {/* Advance Status Button */}
                      {task.status !== 'Completed' ? (
                        <button
                          onClick={() =>
                            updateTaskStatus(selectedProject.id, task.id, nextStatus(task.status))
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-xs font-bold border border-slate-700 transition flex items-center gap-1"
                          title="Advance task to next stage"
                        >
                          <span>{nextStatus(task.status)}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <Check className="w-4 h-4 stroke-[3]" /> Done
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Volunteer Roster & Task Force */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              Eagle Volunteer Task Force ({selectedProject.volunteers.length})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {selectedProject.volunteers.map((vol) => (
                <div
                  key={vol.memberId}
                  className="p-3 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Kuya/Ate {vol.memberNickname} ({vol.memberName})
                    </h5>
                    <span className="text-[10px] text-amber-400 font-medium">{vol.role}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {vol.hoursLogged} hrs logged
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create New Task */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white font-serif">
                Add Project Collaboration Task
              </h3>
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Procure Cold-Chain Vaccine & Vitamin Supplies"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Provide scope, contacts, delivery location, or expected deliverables..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Assign Eagle Member</label>
                  <select
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {allMembers
                      .filter((m) => m.membershipStatus === 'Active')
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.gender === 'Female' ? 'Ate' : 'Kuya'} {m.nickname} ({m.positions[0] || 'Member'})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as ProjectTaskPriority)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow"
              >
                Assign Task to Board
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create New Community Service Project */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white font-serif">
                Propose New Community Service Project
              </h3>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oplan Kalikasan: Coastal Tree Planting"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={newProjectCategory}
                    onChange={(e) => setNewProjectCategory(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Health & Medical">Health & Medical</option>
                    <option value="Education & Literacy">Education & Literacy</option>
                    <option value="Disaster Relief">Disaster Relief</option>
                    <option value="Environmental & Greening">Environmental & Greening</option>
                    <option value="Livelihood & Skills">Livelihood & Skills</option>
                    <option value="Feeding Program">Feeding Program</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Target Date</label>
                  <input
                    type="date"
                    required
                    value={newProjectDate}
                    onChange={(e) => setNewProjectDate(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Location / Venue</label>
                <input
                  type="text"
                  required
                  value={newProjectLocation}
                  onChange={(e) => setNewProjectLocation(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Target Beneficiary Group</label>
                  <input
                    type="text"
                    placeholder="e.g. Underprivileged fisherfolk"
                    value={newProjectBeneficiaries}
                    onChange={(e) => setNewProjectBeneficiaries(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Beneficiary Count</label>
                  <input
                    type="number"
                    value={newProjectBeneficiaryCount}
                    onChange={(e) => setNewProjectBeneficiaryCount(Number(e.target.value))}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Estimated Budget (PHP)</label>
                <input
                  type="number"
                  value={newProjectBudget}
                  onChange={(e) => setNewProjectBudget(Number(e.target.value))}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow"
              >
                Submit Project Proposal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Accomplishment Report Viewer */}
      {isAccomplishmentReportOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
                  Official Accomplishment Report
                </h3>
              </div>
              <button
                onClick={() => setIsAccomplishmentReportOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white text-slate-950 p-5 rounded-2xl space-y-3 font-sans text-xs">
              <div className="text-center border-b pb-2">
                <p className="font-bold text-[11px] uppercase tracking-wider text-amber-800">
                  The Fraternal Order of Eagles - Philippine Eagles, Inc.
                </p>
                <h2 className="font-extrabold text-sm uppercase">
                  Bantayog Elite Eagles Club • BCNBR-1
                </h2>
                <p className="text-[10px] text-slate-600">Socio-Civic Project Accomplishment Dossier</p>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900">{selectedProject.title}</h3>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Category: <strong>{selectedProject.category}</strong> | Date: {selectedProject.date}
                </p>
                <p className="text-slate-600 text-[11px]">
                  Venue: {selectedProject.location}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-2.5 rounded-lg text-center font-mono">
                <div>
                  <span className="block text-[9px] uppercase text-slate-500">Beneficiaries</span>
                  <span className="font-bold text-xs">{selectedProject.beneficiaryCount}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase text-slate-500">Disbursed</span>
                  <span className="font-bold text-xs">₱{selectedProject.actualExpense.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase text-slate-500">Volunteers</span>
                  <span className="font-bold text-xs">{selectedProject.volunteers.length} Eagles</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[11px] uppercase text-slate-800">Executive Summary:</h4>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  {selectedProject.accomplishmentReport || selectedProject.description}
                </p>
              </div>

              <div className="pt-3 border-t flex justify-between text-[10px] text-slate-600">
                <div>
                  <p className="font-bold">Prepared by:</p>
                  <p>{selectedProject.projectLeadName}</p>
                  <p className="text-slate-500">Project Director</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">Attested by:</p>
                  <p>Kuya Ronald Alforte</p>
                  <p className="text-slate-500">Club Secretary</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                alert('Official Accomplishment Report copied to clipboard!');
                setIsAccomplishmentReportOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
            >
              Export / Copy Accomplishment Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
