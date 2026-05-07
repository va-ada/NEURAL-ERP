const express = require('express');
const request = require('supertest');
const { validateRequest } = require('../shared/middleware/validate');

const {
    createStudentValidator,
    updateStudentValidator,
    updateProfileValidator,
} = require('../services/academic-service/src/validators/student.validators');
const {
    createFacultyValidator,
    updateFacultyValidator,
} = require('../services/academic-service/src/validators/faculty.validators');
const {
    createBatchValidator,
    updateBatchValidator,
} = require('../services/academic-service/src/validators/batch.validators');
const {
    createDepartmentValidator,
    updateDepartmentValidator,
} = require('../services/academic-service/src/validators/department.validators');
const {
    createSubjectValidator,
    updateSubjectValidator,
} = require('../services/academic-service/src/validators/subject.validators');

function appFor(validators) {
    const app = express();
    app.use(express.json());
    app.post('/x', validators, validateRequest, (req, res) => res.json({ data: req.body }));
    return app;
}

function expectValidationError(res) {
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
}

describe('academic-service validators', () => {
    it('createStudentValidator rejects invalid payload', async () => {
        const res = await request(appFor(createStudentValidator)).post('/x').send({
            email: 'not-an-email',
            name: '',
            rollNumber: '',
            semester: 99,
            departmentId: 'not-a-uuid',
            batchId: 'not-a-uuid',
        });
        expectValidationError(res);
    });

    it('updateStudentValidator rejects invalid payload', async () => {
        const res = await request(appFor(updateStudentValidator)).post('/x').send({
            semester: 0,
            departmentId: 'not-a-uuid',
        });
        expectValidationError(res);
    });

    it('updateProfileValidator rejects invalid payload', async () => {
        const res = await request(appFor(updateProfileValidator)).post('/x').send({
            semester: 50,
        });
        expectValidationError(res);
    });

    it('createFacultyValidator rejects invalid payload', async () => {
        const res = await request(appFor(createFacultyValidator)).post('/x').send({
            email: 'bad',
            name: '',
            employeeId: '',
            departmentId: 'not-a-uuid',
        });
        expectValidationError(res);
    });

    it('updateFacultyValidator rejects invalid payload', async () => {
        const res = await request(appFor(updateFacultyValidator)).post('/x').send({
            departmentId: 'not-a-uuid',
        });
        expectValidationError(res);
    });

    it('createBatchValidator rejects invalid payload', async () => {
        const res = await request(appFor(createBatchValidator)).post('/x').send({
            name: '',
            year: 'abc',
            currentSemester: 99,
            departmentId: 'not-a-uuid',
        });
        expectValidationError(res);
    });

    it('updateBatchValidator rejects invalid payload', async () => {
        const res = await request(appFor(updateBatchValidator)).post('/x').send({
            currentSemester: 0,
        });
        expectValidationError(res);
    });

    it('createDepartmentValidator rejects invalid payload', async () => {
        const res = await request(appFor(createDepartmentValidator)).post('/x').send({
            name: '',
            code: '',
        });
        expectValidationError(res);
    });

    it('updateDepartmentValidator rejects invalid payload', async () => {
        const res = await request(appFor(updateDepartmentValidator)).post('/x').send({
            hodId: 'not-a-uuid',
        });
        expectValidationError(res);
    });

    it('createSubjectValidator rejects invalid payload', async () => {
        const res = await request(appFor(createSubjectValidator)).post('/x').send({
            name: '',
            code: '',
            credits: 99,
            semester: 0,
            departmentId: 'not-a-uuid',
        });
        expectValidationError(res);
    });

    it('updateSubjectValidator rejects invalid payload', async () => {
        const res = await request(appFor(updateSubjectValidator)).post('/x').send({
            credits: 99,
        });
        expectValidationError(res);
    });

    it('createStudentValidator accepts valid payload', async () => {
        const res = await request(appFor(createStudentValidator)).post('/x').send({
            email: 'a@b.com',
            name: 'Alice',
            rollNumber: 'R001',
            semester: 3,
            departmentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            batchId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        });
        expect(res.status).toBe(200);
    });
});
