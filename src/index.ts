import { createWorker } from 'tesseract.js';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import path from 'path';
import { upload } from './utils/multer';
import fs from 'fs';
import { cloudinary, dUriPdf } from './utils/cloudinary';
import usersRoute from './routes/api/users';
import authRoute from './routes/api/auth';
import connect from './utils/connect';
import { dUri } from './utils/cloudinary';
import UserModel from './models/User.model';
import auth from './middleware/auth';

const app = express();
const port = process.env['PORT'] || 4000;

app.use(cors());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/users', usersRoute);
app.use('/api/auth', authRoute);

interface customTesseractWorker extends Tesseract.Worker {
    getPDF?(title: string): Promise<any>;
}

// const worker: customTesseractWorker = createWorker({
//     logger: (m) => console.log(m),
// });

app.post(
    '/upload',
    auth,
    upload.single('file'),
    (req: Request | any, res: Response) => {
        const { lang }: { lang: string } = req.body;
        if (!lang) {
            res.status(400).send('Language is required !');
            return;
        }
        if (lang.trim() === '') {
            res.status(400).send('Invalid request');
            return;
        }

        let imageLink = '';
        let pdfLink = '';

        if (req.file) {
            try {
                (async () => {
                    const worker: customTesseractWorker = await createWorker({
                        logger: (m) => console.log(m),
                    });
                    try {
                        if (lang) {
                            await worker.load();
                            console.log(lang);
                            await worker.loadLanguage(lang.trim());
                            await worker.initialize(lang.trim());
                        } else {
                            throw new Error('Language is required !');
                        }
                        console.log(req.file);
                        const file = dUri(req).content;

                        const {
                            data: { text },
                        } = await worker.recognize(file as string);
                        console.log(text);
                        if (text) {
                            res.send(text);
                        }

                        const result = await cloudinary.uploader.upload(
                            file as string,
                            {
                                folder: 'project-ocr',
                            }
                        );
                        console.log(result);
                        imageLink = result.secure_url;
                    } catch (err) {
                        res.status(400).send('Language Required');
                    }

                    if (worker.getPDF) {
                        const { data } = await worker.getPDF(
                            'Tesseract OCR Result'
                        );
                        const pdfFile = dUriPdf(Buffer.from(data)).content;
                        const result = await cloudinary.uploader.upload(
                            pdfFile as string,
                            {
                                folder: 'project-ocr-pdfs',
                            }
                        );
                        console.log(result);
                        pdfLink = result.secure_url;
                    }

                    const user = await UserModel.findByIdAndUpdate(
                        req.user.id,
                        {
                            $push: {
                                recent: {
                                    type: 'upload',
                                    imageLink: imageLink,
                                    pdfLink: pdfLink,
                                },
                            },
                        },
                        {
                            upsert: true,
                        }
                    );
                    console.log(user);
                    console.log(user?.recent);
                })();
            } catch (err) {
                console.log('Unable to upload to the server');
                res.status(500).send('Unable to upload to the server');
            }
        } else {
            res.status(400).send('Image file is required.');
        }
    }
);

app.post('/usingLink', auth, (req: Request | any, res: Response) => {
    const worker: customTesseractWorker = createWorker({
        logger: (m) => console.log(m),
    });
    const { lang, imgLink }: { lang: string; imgLink: string } = req.body;

    if (!lang || !imgLink) {
        res.status(400).send('Both Language and Image link are required !');
        return;
    }

    if (lang.trim() === '' || imgLink.trim() === '') {
        res.status(400).send('Invalid request');
        return;
    }

    try {
        (async () => {
            try {
                await worker.load();
                if (lang) {
                    await worker.loadLanguage(lang.trim());
                    await worker.initialize(lang.trim());
                } else {
                    throw new Error('Language is required !');
                }
            } catch (err) {
                res.send(400).send('Language Required');
            }

            try {
                const {
                    data: { text },
                } = await worker.recognize(imgLink);
                console.log(text);
                res.send(text);
            } catch (err) {
                console.log('Image not found');
            }

            let pdfLink = '';
            if (worker.getPDF) {
                const { data } = await worker.getPDF('Tesseract OCR Result');
                const pdfFile = dUriPdf(Buffer.from(data)).content;
                const result = await cloudinary.uploader.upload(
                    pdfFile as string,
                    {
                        folder: 'project-ocr-pdfs',
                    }
                );
                console.log(result);
                pdfLink = result.secure_url;
            }
            const user = await UserModel.findByIdAndUpdate(
                req.user.id,
                {
                    $push: {
                        recent: {
                            type: 'online',
                            imageLink: imgLink,
                            pdfLink: pdfLink,
                        },
                    },
                },
                {
                    upsert: true,
                }
            );
            console.log(user);
            console.log(user?.recent);
        })();
    } catch (err) {
        console.log('Unable to upload to the server');
        res.status(500).send('Unable to upload to the server');
    }
});

app.get('/getRecents', auth, async (req: Request | any, res: Response) => {
    const user = await UserModel.findById(req.user.id);
    if (user) {
        return res.status(200).json(user?.recent);
    }
    return res.status(400).send('Bad Request!');
});

app.get('/check', (_req: Request, res: Response) => {
    res.status(400).send('Server Working!');
});

app.get('*', (_req: Request, res: Response) => {
    console.log('Invalid route');
    res.send(400).send('Bad Request!');
});
app.listen(port, async () => {
    console.log(`App started on port ${port}`);
    await connect();
    // await worker.load();
    // await worker.loadLanguage('eng');
    // await worker.initialize('eng');
});
