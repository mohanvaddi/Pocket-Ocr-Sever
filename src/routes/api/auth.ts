import express, { Request, Response } from 'express';
import UserModel from '../../models/User.model';
const router = express.Router();
import authMiddleware from './../../middleware/auth';

import { check, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface TokenInterface {
    user: {
        id: string;
        role: string;
    };
}

/*
@route    GET api/auth
@desc     Send User details
@access   Public 
*/

router.get('/', authMiddleware, async (req: any | Request, res: Response) => {
    try {
        const user = await UserModel.findById(req.user.id)
            .select('-password')
            .select('-__v')
            .select('-avatar')
            .select('-date');
        if (user) {
            res.send({ isValid: true, user });
        } else {
            res.send({ isValid: false });
        }
    } catch (err: any) {
        console.log(err.message);
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
});

/*
@route    POST api/auth
@desc     Authenticate User login and get Auth token
@access   Public 
*/
router.post(
    '/',
    [
        check('email', 'Please enter a valid email').isEmail(),
        check('password', 'Password is required').exists(),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password } = req.body;
        try {
            // * Check for the user
            const user = await UserModel.findOne({
                email,
            });
            if (!user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

            // * Check if password matches
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'Invalid Credentials' }] });
            }
            // * return jsonwebtoken
            const payload = {
                user: {
                    id: user.id,
                    role: user.role,
                },
            };

            jwt.sign(
                payload,
                process.env['JWT_SECRET'] as string,
                {
                    expiresIn: 36000,
                },
                (err, token) => {
                    if (err) throw err;
                    return res.json({
                        token,
                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            recent: user.recent,
                        },
                    });
                }
            );
        } catch (err) {
            console.error(err);
            return res.status(500).send('Server Error');
        }
    }
);

export default router;
