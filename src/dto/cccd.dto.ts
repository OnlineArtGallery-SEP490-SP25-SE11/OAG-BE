import { z } from "zod";

export const CreateCCCDSchema = z.object({
  id: z.string().nonempty({ message: "CCCD ID is required" }),
  name: z.string().nonempty({ message: "Name is required" }),
  dob: z.string().nonempty({ message: "Date of birth is required" }),
  sex: z.string().nonempty({ message: "Sex is required" }),
  nationality: z.string().nonempty({ message: "Nationality is required" }),
  home: z.string().nonempty({ message: "Home address is required" }),
  address: z.string().nonempty({ message: "Address is required" }),
  doe: z.string().nonempty({ message: "Date of expiry is required" }),
  issue_date: z.string().nonempty({ message: "Issue date is required" }),
  issue_loc: z.string().nonempty({ message: "Issue location is required" }),
  features: z.string().optional(),
  mrz: z.string().optional(),
  user: z.string().nonempty({ message: "User ID is required" }),
  imageFront: z.string().optional(),
  imageBack: z.string().optional(),
});

export const UpdateCCCDSchema = z.object({
  name: z.string().optional(),
  dob: z.string().optional(),
  sex: z.string().optional(),
  nationality: z.string().optional(),
  home: z.string().optional(),
  address: z.string().optional(),
  doe: z.string().optional(),
  issue_date: z.string().optional(),
  issue_loc: z.string().optional(),
  features: z.string().optional(),
  mrz: z.string().optional(),
  imageFront: z.string().optional(),
  imageBack: z.string().optional(),
});

export type CreateCccdDto = z.infer<typeof CreateCCCDSchema>;
export type UpdateCccdDto = z.infer<typeof UpdateCCCDSchema>;