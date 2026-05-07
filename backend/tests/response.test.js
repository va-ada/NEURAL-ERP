const { ok, created, noContent, paginated } = require('../shared/http/response');

function makeRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
}

describe('shared/http/response', () => {
    it('ok() wraps payload in { data }', () => {
        const res = makeRes();
        ok(res, { id: 1 });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: { id: 1 } });
    });

    it('ok() includes meta when provided', () => {
        const res = makeRes();
        ok(res, [1, 2], { count: 2 });
        expect(res.json).toHaveBeenCalledWith({ data: [1, 2], meta: { count: 2 } });
    });

    it('created() uses 201', () => {
        const res = makeRes();
        created(res, { id: 1 });
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('noContent() uses 204 with no body', () => {
        const res = makeRes();
        noContent(res);
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.end).toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    it('paginated() computes totalPages correctly', () => {
        const res = makeRes();
        paginated(res, [1, 2, 3], { page: 1, pageSize: 3, total: 10 });
        expect(res.json).toHaveBeenCalledWith({
            data: [1, 2, 3],
            meta: { page: 1, pageSize: 3, total: 10, totalPages: 4 },
        });
    });
});
