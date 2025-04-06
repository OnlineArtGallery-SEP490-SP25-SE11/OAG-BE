import { injectable } from "inversify";
import CCCDModel, { CCCDDocument } from "@/models/cccd.model";
import { Types } from "mongoose";
import { ICCCDService } from "@/interfaces/service.interface";

@injectable()
export class CCCDService implements ICCCDService {
  async createCCCD(data: any): Promise<CCCDDocument> {
    const cccd = new CCCDModel(data);
    return await cccd.save();
  }

  async getCCCDById(cccdId: string): Promise<CCCDDocument | null> {
    return await CCCDModel.findById(new Types.ObjectId(cccdId));
  }

  async getCccdByUserId(userId: string): Promise<CCCDDocument | null> {
    return await CCCDModel.findOne({ user: new Types.ObjectId(userId) });
  }

  async updateCCCD(cccdId: string, data: any): Promise<CCCDDocument | null> {
    return await CCCDModel.findByIdAndUpdate(
      new Types.ObjectId(cccdId),
      { $set: data },
      { new: true }
    );
  }

  async deleteCCCD(cccdId: string): Promise<void> {
    await CCCDModel.findByIdAndDelete(new Types.ObjectId(cccdId));
  }
}
