import * as cloudinary_import from 'cloudinary';
import DataURIParser from 'datauri/parser';
import path from 'path';
import { Request } from 'express';

const parser = new DataURIParser();

const cloudinary = cloudinary_import.v2;
cloudinary.config({
    cloud_name: process.env['CLOUDINARY_CLOUD_NAME'] as string,
    api_key: process.env['CLOUDINARY_API_KEY'] as string,
    api_secret: process.env['CLOUDINARY_API_SECRET'] as string,
});

const dUri = (req: Request) => {
    return parser.format(
        path.extname(req.file!.originalname).toString(),
        req.file!.buffer
    );
};

const dUriPdf = (buffer: Buffer) => {
    return parser.format('.pdf', buffer);
};

export { cloudinary, dUri, dUriPdf };
