import mongoose, { Document, Schema, model } from 'mongoose';

// Define interface for CCCD document
interface ICCCD extends Document {
  id: string; // Số CCCD
  name: string; // Họ và tên
  dob: string; // Ngày sinh (YYYY-MM-DD)
  sex: string; // Giới tính
  nationality: string; // Quốc tịch
  home: string; // Nguyên quán
  address: string; // Địa chỉ thường trú
  doe: string; // Ngày hết hạn (YYYY-MM-DD)
  issue_date: string; // Ngày cấp (YYYY-MM-DD)
  issue_loc: string; // Nơi cấp
  features?: string; // Đặc điểm nhận dạng
  mrz?: string; // Mã MRZ
  user: mongoose.Types.ObjectId; // Tham chiếu tới User
  imageFront?: string; // Ảnh mặt trước CCCD
  imageBack?: string; // Ảnh mặt sau CCCD
  createdAt?: Date;
  updatedAt?: Date;
}

// Create the schema
const cccdSchema = new Schema<ICCCD>(
  {
    id: { 
      type: String, 
      required: true,
      unique: true
    },
    name: { 
      type: String, 
      required: true 
    },
    dob: { 
      type: String, 
      required: true 
    },
    sex: { 
      type: String, 
      required: true 
    },
    nationality: { 
      type: String, 
      required: true 
    },
    home: { 
      type: String, 
      required: true 
    },
    address: { 
      type: String, 
      required: true 
    },
    doe: { 
      type: String, 
      required: true 
    },
    issue_date: { 
      type: String, 
      required: true 
    },
    issue_loc: { 
      type: String, 
      required: true 
    },
    features: { 
      type: String 
    },
    mrz: { 
      type: String 
    },
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    imageFront: { 
      type: String 
    },
    imageBack: { 
      type: String 
    }
  },
  { timestamps: true }
);

// Create and export the model
const CCCD = model<ICCCD>('CCCD', cccdSchema);

// Export type for use in other files
export type CCCDDocument = ICCCD;

export default CCCD;