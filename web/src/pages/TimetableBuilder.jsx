import React, { useState, useEffect } from 'react';
import { timetableAPI, academicAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './TimetableBuilder.css';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const TIME_SLOTS = [
    { start: '9:00', end: '10:00', label: '9:00 - 10:00 AM' },
    { start: '10:00', end: '11:00', label: '10:00 - 11:00 AM' },
    { start: '11:00', end: '12:00', label: '11:00 - 12:00 PM' },
    { start: '12:00', end: '1:00', label: '12:00 - 1:00 PM', isBreak: true },
    { start: '1:00', end: '2:00', label: '1:00 - 2:00 PM' },
    { start: '2:00', end: '3:00', label: '2:00 - 3:00 PM' },
    { start: '3:00', end: '4:00', label: '3:00 - 4:00 PM' },
    { start: '4:00', end: '5:00', label: '4:00 - 5:00 PM' },
];

const COLORS = ['#2563EB', '#22C55E', '#EC4899', '#F59E0B', '#8B5CF6', '#EF4444', '#0891B2', '#EA580C'];

export default function TimetableBuilder() {
    const { showToast } = useToast();

    // Selectors
    const [departments, setDepartments] = useState([]);
    const [batches, setBatches] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');

    // Data
    const [subjects, setSubjects] = useState([]); // Array of { id, name, code, shortName, faculty: {id, name} }
    const [grid, setGrid] = useState({}); // `${day}_${startTime}` -> { subject, faculty, room, type, conflict }

    // State
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [conflicts, setConflicts] = useState([]);

    useEffect(() => {
        loadDepartmentsAndBatches();
    }, []);

    useEffect(() => {
        if (selectedBatch) {
            loadBatchData(selectedBatch);
        } else {
            setGrid({});
            setSubjects([]);
        }
    }, [selectedBatch]);

    const loadDepartmentsAndBatches = async () => {
        try {
            const [deptRes, batchRes] = await Promise.all([
                academicAPI.getDepartments(),
                academicAPI.getBatches(),
            ]);
            const deptData = Array.isArray(deptRes) ? deptRes : deptRes.data || [];
            const batchData = Array.isArray(batchRes) ? batchRes : batchRes.data || [];
            setDepartments(deptData);
            setBatches(batchData);
        } catch (err) {
            showToast('Failed to load filter data', 'error');
        }
    };

    const loadBatchData = async (batchId) => {
        setLoading(true);
        try {
            // 1. Load subjects & faculty for this batch
            // Because our mock data creates subjects & faculty-subjects, we'll fetch all faculty and subjects for this dept
            const batchObj = batches.find(b => b.id === batchId);
            if (!batchObj) return;

            const [subRes, facRes] = await Promise.all([
                academicAPI.getSubjects(),
                academicAPI.getFaculty()
            ]);

            const subData = Array.isArray(subRes) ? subRes : subRes.data || [];
            const facData = Array.isArray(facRes) ? facRes : facRes.data || [];

            // Filter by dept (Semester 6 subjects)
            const deptSubjects = subData.filter(s => s.departmentId === batchObj.departmentId && s.semester === 6);
            const deptFaculty = facData.filter(f => f.departmentId === batchObj.departmentId);

            // Create a palette combining subject + a random faculty from the dept (since we don't have the exact facultySubject mapping in the response without a custom endpoint)
            const palette = deptSubjects.map((sub, i) => ({
                ...sub,
                color: COLORS[i % COLORS.length],
                faculty: deptFaculty[i % deptFaculty.length] || deptFaculty[0]
            }));
            setSubjects(palette);

            // 2. Load existing timetable
            const ttRes = await timetableAPI.getByBatch(batchId);
            const newGrid = {};

            const ttData = Array.isArray(ttRes) ? { timetable: ttRes } : ttRes.data || ttRes || { timetable: {} };
            const timetableMap = ttData.timetable || {};

            // timetableMap is grouped by day: { MONDAY: [slots], TUESDAY: [slots] }
            Object.values(timetableMap).flat().forEach(slot => {
                const subColor = palette.find(p => p.id === slot.subjectId)?.color || COLORS[0];
                newGrid[`${slot.day}_${slot.startTime}`] = {
                    subjectId: slot.subjectId,
                    facultyId: slot.facultyId,
                    subjectName: slot.subject.shortName || slot.subject.name.split(' ')[0],
                    facultyName: slot.faculty.user.name.split(' ').pop(),
                    room: slot.room,
                    type: slot.type,
                    color: subColor
                };
            });

            setGrid(newGrid);
            setConflicts([]);
        } catch (err) {
            showToast('Failed to load timetable data', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ─── Drag & Drop Handlers ──────────────────────────────
    const handleDragStart = (e, subject) => {
        e.dataTransfer.setData('application/json', JSON.stringify(subject));
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = async (e, day, timeSlot) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        if (!selectedBatch) return showToast('Select a batch first', 'warning');

        try {
            const subjectData = JSON.parse(e.dataTransfer.getData('application/json'));
            const key = `${day}_${timeSlot.start}`;

            // Optimistic update
            const newSlot = {
                subjectId: subjectData.id,
                facultyId: subjectData.faculty.id,
                subjectName: subjectData.shortName || subjectData.name.split(' ')[0],
                facultyName: subjectData.faculty.user?.name?.split(' ').pop() || 'Faculty',
                room: subjectData.faculty.room || 'TBD',
                type: 'LECTURE',
                color: subjectData.color
            };

            const newGrid = { ...grid, [key]: newSlot };
            setGrid(newGrid);

            // Detect conflicts for this single drop (makes UI more responsive)
            await validateConflicts(newGrid);

        } catch (err) {
            console.error("Drop error", err);
        }
    };

    const removeSlot = (day, timeStart) => {
        const key = `${day}_${timeStart}`;
        const newGrid = { ...grid };
        delete newGrid[key];
        setGrid(newGrid);
        validateConflicts(newGrid);
    };

    // ─── Conflict Detection & Saving ───────────────────────
    const validateConflicts = async (currentGrid) => {
        if (!selectedBatch) return;

        // Prepare slots array for API
        const slotsArray = [];
        for (const [key, slot] of Object.entries(currentGrid)) {
            const [day, startTime] = key.split('_');
            slotsArray.push({
                facultyId: slot.facultyId,
                day,
                startTime,
                room: slot.room
            });
        }

        if (slotsArray.length === 0) {
            setConflicts([]);
            return;
        }

        try {
            const res = await timetableAPI.checkConflicts(selectedBatch, slotsArray);
            const conflictsData = Array.isArray(res) ? res : res.data?.conflicts || res.conflicts || [];
            setConflicts(conflictsData);
        } catch (err) {
            console.error("Conflict check failed", err);
        }
    };

    const handleSave = async () => {
        if (!selectedBatch) return showToast('Please select a batch', 'warning');

        setSaving(true);
        try {
            const slotsData = Object.entries(grid).map(([key, slot]) => {
                const [day, startTime] = key.split('_');
                const endTime = TIME_SLOTS.find(t => t.start === startTime)?.end || '17:00';
                return {
                    subjectId: slot.subjectId,
                    facultyId: slot.facultyId,
                    day,
                    startTime,
                    endTime,
                    room: slot.room,
                    type: slot.type
                };
            });

            const res = await timetableAPI.bulkUpdate(selectedBatch, slotsData);
            showToast('Timetable saved successfully', 'success');

            // Re-validate to ensure no sneaky conflicts
            await validateConflicts(grid);
            if (res && (res.slots || res.data?.slots)) {
                // If there are conflicts returned from backend we can display them
            }
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to save timetable', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleClear = async () => {
        if (!selectedBatch) return;
        if (!window.confirm('Are you sure you want to clear this entire timetable?')) return;

        setSaving(true);
        try {
            await timetableAPI.clearBatch(selectedBatch);
            setGrid({});
            setConflicts([]);
            showToast('Timetable cleared', 'success');
        } catch (err) {
            showToast('Failed to clear timetable', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Helper to check if a grid cell has a conflict
    const getConflictForSlot = (day, startTime) => {
        return conflicts.find(c => c.day === day && c.time === startTime);
    };

    const safeBatches = Array.isArray(batches) ? batches : [];
    const filteredBatches = safeBatches.filter(b => b.departmentId === selectedDept);

    return (
        <div className="timetable-builder">
            <div className="dashboard-header" style={{ marginBottom: 16 }}>
                <h1>Timetable Builder</h1>
                <div className="header-right">
                    <button className="btn-secondary" onClick={handleClear} disabled={saving || !selectedBatch}>Clear Grid</button>
                    <button className="btn-primary" onClick={handleSave} disabled={saving || !selectedBatch}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="builder-controls">
                <div className="filter-group">
                    <label>Department</label>
                    <select value={selectedDept} onChange={e => { setSelectedDept(e.target.value); setSelectedBatch(''); }}>
                        <option value="">Select Department...</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Batch</label>
                    <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} disabled={!selectedDept}>
                        <option value="">Select Batch...</option>
                        {filteredBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>

                {conflicts.length > 0 && (
                    <div className="conflict-warning badge">
                        ⚠️ {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''} Detected
                    </div>
                )}
            </div>

            <div className="builder-layout">
                {/* Palette Sidebar */}
                <div className="subjects-palette">
                    <h3>Subjects ({subjects.length})</h3>
                    <p className="palette-desc">Drag subjects onto the grid</p>

                    {!selectedBatch ? (
                        <div className="empty-palette">Select a batch to load subjects</div>
                    ) : subjects.length === 0 ? (
                        <div className="empty-palette">No subjects found</div>
                    ) : (
                        <div className="subject-list">
                            {subjects.map(sub => (
                                <div
                                    key={sub.id}
                                    className="draggable-subject"
                                    style={{ borderLeftColor: sub.color }}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, sub)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <div className="subj-title">{sub.shortName || sub.name}</div>
                                    <div className="subj-fac">Prof. {sub.faculty?.user?.name?.split(' ').pop() || 'Unknown'}</div>
                                    <div className="drag-handle">⋮⋮</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Grid */}
                <div className="tt-grid-wrapper">
                    {loading && <div className="grid-loader">Loading timetable...</div>}
                    <table className={`tt-grid ${loading ? 'blurred' : ''}`}>
                        <thead>
                            <tr>
                                <th>Time / Day</th>
                                {DAYS.map(d => <th key={d}>{d.substring(0, 3)}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {TIME_SLOTS.map((slot, i) => (
                                slot.isBreak ? (
                                    <tr key={slot.start} className="break-row">
                                        <td className="time-col">{slot.label}</td>
                                        <td colSpan="5" className="break-cell">LUNCH BREAK</td>
                                    </tr>
                                ) : (
                                    <tr key={slot.start}>
                                        <td className="time-col">{slot.label}</td>
                                        {DAYS.map(day => {
                                            const cellKey = `${day}_${slot.start}`;
                                            const data = grid[cellKey];
                                            const conflict = getConflictForSlot(day, slot.start);

                                            return (
                                                <td
                                                    key={cellKey}
                                                    className={`slot-cell ${data ? 'filled' : ''} ${conflict ? 'has-conflict' : ''}`}
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={(e) => handleDrop(e, day, slot)}
                                                >
                                                    {data ? (
                                                        <div className="slot-card" style={{ backgroundColor: data.color + '15', borderLeftColor: data.color }}>
                                                            <button className="remove-slot" onClick={() => removeSlot(day, slot.start)}>×</button>
                                                            <div className="slot-subj" style={{ color: data.color }}>{data.subjectName}</div>
                                                            <div className="slot-fac">{data.facultyName}</div>
                                                            <div className="slot-room">{data.room}</div>

                                                            {conflict && (
                                                                <div className="conflict-tooltip">
                                                                    {conflict.message}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="empty-slot-dropzone">
                                                            <span>+</span>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                )
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
