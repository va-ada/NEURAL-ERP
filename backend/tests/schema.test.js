const fs = require('fs');
const path = require('path');

describe('Prisma Schema', () => {
    const schemaPath = path.join(__dirname, '../database/prisma/schema.prisma');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    const requiredModels = [
        'Institution', 'User', 'Student', 'Faculty', 'Department', 'Subject', 'Batch',
        'FacultySubject', 'Attendance', 'TimetableSlot', 'Assignment', 'Submission',
        'Grade', 'SemesterResult', 'Exam', 'CareerOpportunity', 'CareerEvent',
        'CareerApplication', 'StudentSkill', 'NoteFolder', 'Note', 'SharedNote',
        'Fee', 'Payment', 'LibraryBook', 'BookIssue', 'ForumPost', 'ForumReply',
        'Notification', 'Announcement', 'AuditLog'
    ];

    requiredModels.forEach(model => {
        it(`should have ${model} model`, () => {
            expect(schema).toContain(`model ${model}`);
        });
    });

    const requiredEnums = [
        'Role', 'AttendanceStatus', 'AssignmentStatus', 'Day',
        'FeeStatus', 'FeeType', 'BookStatus', 'NotificationType',
        'AnnouncementPriority', 'ExamType', 'SlotType'
    ];

    requiredEnums.forEach(enumName => {
        it(`should have ${enumName} enum`, () => {
            expect(schema).toContain(`enum ${enumName}`);
        });
    });
});
