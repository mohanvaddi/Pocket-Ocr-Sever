import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import gravatar from 'gravatar';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import UserModel from '../../models/User.model';

/*
@route    POST api/users
@desc     Register User
@access   Public 
*/
const router = express.Router();
router.post(
    '/',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please enter a valid email').isEmail(),
        check(
            'password',
            'Please enter a password with 8 or more characters.'
        ).isLength({
            min: 8,
        }),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, email, password, role } = req.body;
        try {
            // * See if user exists
            const userData = await UserModel.findOne({
                email: email,
            });
            if (userData) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'User Already Exists' }] });
            }

            // * Get user gravatar
            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm',
            });

            // * Encrypt password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const user = new UserModel({
                name,
                email,
                password: hashedPassword,
                avatar,
                role,
            });
            await user.save();

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
