import mongoose, { Document } from 'mongoose';

export interface RecentItem {
    type: 'upload' | 'link';
    imageLink: string;
    pdfLink: string;
    date?: Date;
}

export interface UserInterface extends Document {
    name: string;
    email: string;
    role: 'normal' | 'premium';
    password: string;
    avatar?: string;
    date?: any;
    recent?: RecentItem[];
}

const UserSchema = new mongoose.Schema<UserInterface>({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: String,
        enum: ['normal', 'premium'],
        default: 'normal',
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    recent: [
        {
            type: {
                type: String,
                enum: ['upload', 'online'],
            },
            imageLink: {
                type: String,
            },
            pdfLink: {
                type: String,
            },
            date: {
                type: Date,
                default: Date.now,
            },
        },
    ],
});

export default mongoose.model<UserInterface>('User', UserSchema);
