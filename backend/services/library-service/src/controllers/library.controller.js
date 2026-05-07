const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const auditLog = require('../../../../shared/utils/auditLog');

const getBooks = async (req, res, next) => {
    try {
        const { search, category, status } = req.query;
        const where = {};
        if (category) where.category = category;
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { author: { contains: search, mode: 'insensitive' } },
            ];
        }
        const books = await prisma.libraryBook.findMany({ where, orderBy: { title: 'asc' } });
        res.json({ books, total: books.length });
    } catch (err) { next(err); }
};

const addBook = async (req, res, next) => {
    try {
        const { title, author, isbn, category, publisher, year, copies, coverColor } = req.body;
        const book = await prisma.libraryBook.create({
            data: { title, author, isbn, category, publisher, year, copies, available: copies, coverColor },
        });
        await auditLog(req.user?.id, 'CREATE', 'LibraryBook', book.id);
        res.status(201).json({ message: 'Book added.', book });
    } catch (err) { next(err); }
};

const issueBook = async (req, res, next) => {
    try {
        const { bookId, studentId, dueDate } = req.body;
        const book = await prisma.libraryBook.findUnique({ where: { id: bookId } });
        if (!book) throw new AppError('Book not found.', 404);
        if (book.available <= 0) throw new AppError('No copies available.', 400);

        const [issue] = await prisma.$transaction([
            prisma.bookIssue.create({ data: { bookId, studentId, dueDate: new Date(dueDate) } }),
            prisma.libraryBook.update({ where: { id: bookId }, data: { available: book.available - 1, status: book.available - 1 === 0 ? 'ISSUED' : 'AVAILABLE' } }),
        ]);
        await auditLog(req.user?.id, 'ISSUE', 'BookIssue', issue.id, { bookId, studentId, dueDate });

        res.status(201).json({ message: 'Book issued.', issue });
    } catch (err) { next(err); }
};

const returnBook = async (req, res, next) => {
    try {
        const { issueId } = req.params;
        const issue = await prisma.bookIssue.findUnique({ where: { id: issueId }, include: { book: true } });
        if (!issue) throw new AppError('Issue record not found.', 404);
        if (issue.returnedAt) throw new AppError('Book already returned.', 400);

        const fine = new Date() > issue.dueDate ? Math.ceil((new Date() - issue.dueDate) / (1000 * 60 * 60 * 24)) * 5 : 0;

        await prisma.$transaction([
            prisma.bookIssue.update({ where: { id: issueId }, data: { returnedAt: new Date(), fine } }),
            prisma.libraryBook.update({ where: { id: issue.bookId }, data: { available: issue.book.available + 1, status: 'AVAILABLE' } }),
        ]);
        await auditLog(req.user?.id, 'RETURN', 'BookIssue', issueId, { fineAmount: fine });

        res.json({ message: 'Book returned.', fine });
    } catch (err) { next(err); }
};

const getIssued = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const issues = await prisma.bookIssue.findMany({
            where: { studentId },
            include: { book: { select: { title: true, author: true, category: true, coverColor: true } } },
            orderBy: { issuedAt: 'desc' },
        });
        res.json({ issues, total: issues.length });
    } catch (err) { next(err); }
};

module.exports = { getBooks, addBook, issueBook, returnBook, getIssued };
