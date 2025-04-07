import {
  DocumentType,
    getModelForClass,
    modelOptions,
    prop,
    type Ref
  } from '@typegoose/typegoose';
  import UserModel from './user.model';
  
  @modelOptions({
    schemaOptions: {
      timestamps: true
    }
  })
  class CCCD {
    @prop({ required: true, unique: true })
    id!: string; // Số CCCD
  
    @prop({ required: true })
    name!: string; // Họ và tên
  
    @prop({ required: true })
    dob!: string; // Ngày sinh (YYYY-MM-DD)
  
    @prop({ required: true })
    sex!: string; // Giới tính
  
    @prop({ required: true })
    nationality!: string; // Quốc tịch
  
    @prop({ required: true })
    home!: string; // Nguyên quán
  
    @prop({ required: true })
    address!: string; // Địa chỉ thường trú
  
    @prop({ required: true })
    doe!: string; // Ngày hết hạn (YYYY-MM-DD)
  
    @prop({ required: true })
    issue_date!: string; // Ngày cấp (YYYY-MM-DD)
  
    @prop({ required: true })
    issue_loc!: string; // Nơi cấp
  
    @prop({ type: () => String })
    features?: string; // Đặc điểm nhận dạng
  
    @prop({ type: () => String })
    mrz?: string; // Mã MRZ
  
    @prop({ required: true, ref: () => 'User' }) // Tham chiếu tới UserModel bằng tên collection
    user!: Ref<typeof UserModel>;
  
    @prop({ type: () => String })
    imageFront?: string; // Ảnh mặt trước CCCD
  
    @prop({ type: () => String })
    imageBack?: string; // Ảnh mặt sau CCCD
  }
  
  const CCCDModel = getModelForClass(CCCD);
  export default CCCDModel;
  export type CCCDDocument = DocumentType<CCCD>;