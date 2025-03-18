import { getModelForClass, modelOptions, prop, type Ref, pre } from '@typegoose/typegoose';
import { ReasonReport, ReportStatus } from '../constants/enum';
import User from './user.model';
import { Blog } from './blog.model';
import Artwork from './artwork.model';

@modelOptions({schemaOptions: {timestamps: true}})
class Report {
    @prop({ref: () => User, required: true, index: true})
    reporterId!: Ref<typeof User>;

    @prop({ refPath: "reportedType", required: true })
    public refId!: Ref<Blog | typeof Artwork>; 

    @prop({ required: true, enum: ['BLOG', 'ARTWORK'] })
    public refType!: string;

    @prop({required: true, ref: () => User})
    reportedId!: Ref<typeof User>;

    @prop({required: true, enum: ReasonReport, type: String})
    reason!: string;

    @prop({required: true, type: String})
    description!: string;

    @prop({required: true, type: String, enum: ReportStatus, default: ReportStatus.PENDING})
    status?: string;
    
    @prop({required: false, type: String})
    url?: string;

    @prop({ required: false, type: [String] })
    image?: string[];
}

const ReportModel = getModelForClass(Report);
export default ReportModel;
