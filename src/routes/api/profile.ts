import express, { Request, Response } from 'express';
const router = express.Router();

/*
@route    api/profile
@desc     Test Route
@access   Public 
*/

router.get('/', (req: Request, res: Response) => {
    res.send('profile route');
});

export default router;
