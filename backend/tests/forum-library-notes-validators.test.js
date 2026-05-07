const express = require('express');
const request = require('supertest');
const { validateRequest } = require('../shared/middleware/validate');

const { createPostValidator, updatePostValidator } = require('../services/forum-service/src/validators/post.validators');
const { createReplyValidator } = require('../services/forum-service/src/validators/reply.validators');
const { createBookValidator, updateBookValidator } = require('../services/library-service/src/validators/book.validators');
const { issueBookValidator, returnBookValidator } = require('../services/library-service/src/validators/issue.validators');
const { createFolderValidator, updateFolderValidator } = require('../services/notes-service/src/validators/folder.validators');
const { createNoteValidator, updateNoteValidator } = require('../services/notes-service/src/validators/note.validators');
const { shareNoteValidator } = require('../services/notes-service/src/validators/share.validators');

function appFor(validators) {
    const app = express();
    app.use(express.json());
    app.post('/x', validators, validateRequest, (req, res) => res.json({ ok: true }));
    return app;
}

function expectValidationError(res) {
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
}

describe('forum/library/notes validators (invalid payloads)', () => {
    it('post.validators: createPostValidator rejects missing/empty fields', async () => {
        const res = await request(appFor(createPostValidator)).post('/x').send({ studentId: 'not-a-uuid', title: '', content: '' });
        expectValidationError(res);
    });

    it('post.validators: updatePostValidator rejects empty title', async () => {
        const res = await request(appFor(updatePostValidator)).post('/x').send({ title: '   ' });
        expectValidationError(res);
    });

    it('reply.validators: createReplyValidator rejects bad UUID and empty content', async () => {
        const res = await request(appFor(createReplyValidator)).post('/x').send({ studentId: 'nope', content: '' });
        expectValidationError(res);
    });

    it('book.validators: createBookValidator rejects empty title/author and bad isbn', async () => {
        const res = await request(appFor(createBookValidator)).post('/x').send({ title: '', author: '', isbn: 'short' });
        expectValidationError(res);
    });

    it('book.validators: updateBookValidator rejects bad status enum', async () => {
        const res = await request(appFor(updateBookValidator)).post('/x').send({ status: 'NOT_A_STATUS' });
        expectValidationError(res);
    });

    it('issue.validators: issueBookValidator rejects bad UUIDs and bad date', async () => {
        const res = await request(appFor(issueBookValidator)).post('/x').send({ bookId: 'x', studentId: 'y', dueDate: 'not-a-date' });
        expectValidationError(res);
    });

    it('issue.validators: returnBookValidator rejects negative fine and bad date', async () => {
        const res = await request(appFor(returnBookValidator)).post('/x').send({ returnedAt: 'bad', fine: -5 });
        expectValidationError(res);
    });

    it('folder.validators: createFolderValidator rejects missing studentId and empty name', async () => {
        const res = await request(appFor(createFolderValidator)).post('/x').send({ studentId: 'no', name: '' });
        expectValidationError(res);
    });

    it('note.validators: createNoteValidator rejects bad folderId and empty title', async () => {
        const res = await request(appFor(createNoteValidator)).post('/x').send({ folderId: 'no-uuid', title: '', content: '' });
        expectValidationError(res);
    });

    it('note.validators: updateNoteValidator rejects non-array tags', async () => {
        const res = await request(appFor(updateNoteValidator)).post('/x').send({ tags: 'not-an-array' });
        expectValidationError(res);
    });

    it('share.validators: shareNoteValidator rejects non-array sharedWith', async () => {
        const res = await request(appFor(shareNoteValidator)).post('/x').send({ sharedWith: 'not-an-array' });
        expectValidationError(res);
    });

    it('folder.validators: updateFolderValidator rejects empty name', async () => {
        const res = await request(appFor(updateFolderValidator)).post('/x').send({ name: '   ' });
        expectValidationError(res);
    });
});
