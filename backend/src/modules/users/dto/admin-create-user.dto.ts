import { Role } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";
import { CreateUserDto } from "./create-user.dto";

export class AdminCreateUserDto extends CreateUserDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}