import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'agent1' })
  @IsString()
  username!: string;

  @ApiProperty({ example: 'ChangeMe123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: ['AgentCredit'] })
  @IsArray()
  roles!: string[];
}

