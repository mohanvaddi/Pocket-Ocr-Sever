import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export default (req: any | Request, res: Response, next: NextFunction) => {
    // * Get token from header.
    const token = req.header('x-auth-token');

    // * Check if exists
    if (!token) {
        return res
            .status(401)
            .json({ errors: [{ msg: 'No token, authorization denied.' }] });
    }
    //* Verify Token
    try {
        const decoded: any = jwt.verify(
            token,
            process.env['JWT_SECRET'] as string
        );
        req.user = decoded.user;
        console.log(req.user);
        next();
    } catch (err) {
        res.json({
            statusText: 'Invalid token, authorization denied.',
            status: 401,
        });
    }
};
