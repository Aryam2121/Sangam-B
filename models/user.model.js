import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcryptjs from "bcryptjs"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, 
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, 
        },
        fullName: {
            type: String,
            required: true,
            trim: true, 
            index: true
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        },
        role: {
            type: String,
            enum: ['Main Admin', 'Worker','Department Admin','Officer','Technician','Contractor'],
            required: true
        },
        department:{
            type: String,
            function() {
                return this.role !== 'Main Admin';
            },
        },
        // assignedProjects: [{
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: 'Project',
        // }],
        // past project implementTION
    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcryptjs.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcryptjs.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    const payload = {
        _id: this._id,
        email: this.email,
        username: this.username,
        role: this.role,
        fullName: this.fullName
    };

    // Conditionally add the department field if it exists
    if (this.department) {
        payload.department = this.department;
    }
    return jwt.sign(
        payload,
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)