import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true }
},
{ timestamps: true });

userSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function (password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

export default mongoose.model('User', userSchema);