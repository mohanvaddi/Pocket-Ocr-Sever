import express, { Request, Response } from 'express';
const router = express.Router();

/*
@route    api/posts
@desc     Test Route
@access   Public 
*/

router.get('/', (_req: Request, res: Response) => {
    res.send('posts route');
});

export default router;
