import mongose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connect = async () => {
    try {
        await mongose.connect(process.env['MONGODB_URI'] as string);
        console.log('DB Connected!');
    } catch (err) {
        console.error(err);
        // ! Exit process with failure
        process.exit(1);
    }
};

export default connect;
