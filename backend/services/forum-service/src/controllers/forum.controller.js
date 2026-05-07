const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const auditLog = require('../../../../shared/utils/auditLog');

const getPosts = async (req, res, next) => {
    try {
        const { category, page = 1, limit = 20 } = req.query;
        const where = {};
        if (category) where.category = category;

        const [posts, total] = await Promise.all([
            prisma.forumPost.findMany({
                where,
                include: {
                    student: { include: { user: { select: { name: true } } } },
                    replies: { select: { id: true } },
                },
                orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
            }),
            prisma.forumPost.count({ where }),
        ]);

        res.json({
            posts: posts.map(p => ({
                ...p,
                author: p.student?.user?.name,
                replyCount: p.replies.length,
            })),
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
        });
    } catch (err) { next(err); }
};

const createPost = async (req, res, next) => {
    try {
        const { studentId, title, content, category } = req.body;
        const post = await prisma.forumPost.create({
            data: { studentId, title, content, category },
        });
        await auditLog(req.user?.id, 'CREATE', 'ForumPost', post.id, { category, hasContent: !!content });
        res.status(201).json({ message: 'Post created.', post });
    } catch (err) { next(err); }
};

const getPost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await prisma.forumPost.findUnique({
            where: { id },
            include: {
                student: { include: { user: { select: { name: true } } } },
                replies: {
                    include: { student: { include: { user: { select: { name: true } } } } },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!post) throw new AppError('Post not found.', 404);
        res.json({ post });
    } catch (err) { next(err); }
};

const reply = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { studentId, content } = req.body;
        const r = await prisma.forumReply.create({
            data: { postId: id, studentId, content },
        });
        await auditLog(req.user?.id, 'CREATE', 'ForumReply', r.id, { postId: id });
        res.status(201).json({ message: 'Reply added.', reply: r });
    } catch (err) { next(err); }
};

const toggleLike = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await prisma.forumPost.findUnique({ where: { id } });
        if (!post) throw new AppError('Post not found.', 404);

        const updated = await prisma.forumPost.update({
            where: { id },
            data: { likes: post.likes + 1 },
        });
        await auditLog(req.user?.id, 'LIKE', 'ForumPost', id);
        res.json({ likes: updated.likes });
    } catch (err) { next(err); }
};

module.exports = { getPosts, createPost, getPost, reply, toggleLike };
